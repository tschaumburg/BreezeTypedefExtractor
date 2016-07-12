//------------------------------------------------------------------------------
// <copyright file="BreezeTypeDefsCommand.cs" company="Company">
//     Copyright (c) Company.  All rights reserved.
// </copyright>
//------------------------------------------------------------------------------

using System;
using System.ComponentModel.Design;
using System.Globalization;
using Microsoft.VisualStudio.Shell;
using Microsoft.VisualStudio.Shell.Interop;
using Microsoft.VisualStudio;
using System.IO;
using System.Runtime.InteropServices;
using BreezeTypeDefs.Generators;
using System.Collections.Generic;
using EnvDTE;
using EnvDTE80;

namespace BreezeTypeDefs
{
    /// <summary>
    /// Command handler
    /// </summary>
    internal sealed class BreezeTypeDefsCommand
    {
        /// <summary>
        /// Command ID.
        /// </summary>
        public const int CommandId = 0x0100;

        /// <summary>
        /// Command menu group (command set GUID).
        /// </summary>
        public static readonly Guid CommandSet = new Guid("b2dc7f2b-46c1-4034-8136-d6fcf6066e57");

        /// <summary>
        /// VS Package that provides this command, not null.
        /// </summary>
        private readonly Package package;

        /// <summary>
        /// Initializes a new instance of the <see cref="BreezeTypeDefsCommand"/> class.
        /// Adds our command handlers for menu (commands must exist in the command table file)
        /// </summary>
        /// <param name="package">Owner package, not null.</param>
        private BreezeTypeDefsCommand(Package package)
        {
            if (package == null)
            {
                throw new ArgumentNullException("package");
            }

            this.package = package;

            OleMenuCommandService commandService = this.ServiceProvider.GetService(typeof(IMenuCommandService)) as OleMenuCommandService;
            if (commandService != null)
            {
                var menuCommandID = new CommandID(CommandSet, CommandId);

                // WE COMMENT OUT THE LINE BELOW
                //var menuItem = new MenuCommand(this.MenuItemCallback, menuCommandID);

                // AND REPLACE IT WITH A DIFFERENT TYPE
                var menuItem = new OleMenuCommand(MenuItemCallback, menuCommandID);
                menuItem.BeforeQueryStatus += menuCommand_BeforeQueryStatus;

                commandService.AddCommand(menuItem);
            }
        }

        /// <summary>
        /// Gets the instance of the command.
        /// </summary>
        public static BreezeTypeDefsCommand Instance
        {
            get;
            private set;
        }

        /// <summary>
        /// Gets the service provider from the owner package.
        /// </summary>
        private IServiceProvider ServiceProvider
        {
            get
            {
                return this.package;
            }
        }

        /// <summary>
        /// Initializes the singleton instance of the command.
        /// </summary>
        /// <param name="package">Owner package, not null.</param>
        public static void Initialize(Package package)
        {
            Instance = new BreezeTypeDefsCommand(package);
        }

        /// <summary>
        /// This function is the callback used to execute the command when the menu item is clicked.
        /// See the constructor to see how the menu item is associated with this function using
        /// OleMenuCommandService service and MenuCommand class.
        /// </summary>
        /// <param name="sender">Event sender.</param>
        /// <param name="e">Event args.</param>
        private async void MenuItemCallback(object sender, EventArgs e)
        {
            try
            {
                IVsSolution solution = null;
                IVsHierarchy project = null;
                uint itemid = VSConstants.VSITEMID_NIL;

                if (!TryGetSelectedItem(out solution, out project, out itemid))
                    return;

                string breezeinfoFilename = _GetItemFullPath(project, itemid);
                if (breezeinfoFilename == null)
                    return;

                // Save any changes in .btd file:
                VsShellUtilities.SaveFileIfDirty(ServiceProvider, breezeinfoFilename);

                // Generate/update output files (on disk):
                var generatedFiles = await BreezeTypeDefGenerator.GenerateOutputs(breezeinfoFilename);

                // Add them to the project:
                AddGeneratedFiles(breezeinfoFilename, generatedFiles, project, itemid);

                // Reload the project:
                _ReloadProject(solution, project);

                string info =
                    "Generated Breeze type definitions" + Environment.NewLine
                    + "   "
                    + string.Join(Environment.NewLine + "   ", generatedFiles);

                VsShellUtilities.LogMessage("BreezeTypeDefs extension", info, __ACTIVITYLOG_ENTRYTYPE.ALE_INFORMATION);
            }
            catch (Exception exc)
            {
                VsShellUtilities.ShowMessageBox(
                    this.ServiceProvider,
                    GetMessages(exc),
                    "Error generating Breeze type definitions",
                    OLEMSGICON.OLEMSGICON_CRITICAL,
                    OLEMSGBUTTON.OLEMSGBUTTON_OK,
                    OLEMSGDEFBUTTON.OLEMSGDEFBUTTON_FIRST);

                VsShellUtilities.LogError("BreezeTypeDefs extension", exc.ToString());
            }
        }

        private static string GetMessages(Exception exc)
        {
            if (exc is AggregateException)
            {
                var aggr = exc as AggregateException;
                string res = "";
                foreach( var inner in aggr.InnerExceptions)
                {
                    res = res + GetMessages(inner);
                }

                return res;
            }

            return exc.Message + Environment.NewLine;
        }

        #region Enable menu for .breezeinfo files only
        void menuCommand_BeforeQueryStatus(object sender, EventArgs e)
        {
            // get the menu that fired the event
            var menuCommand = sender as MenuCommand;
            if (menuCommand != null)
            {
                // start by assuming that the menu will not be shown
                menuCommand.Visible = false;
                menuCommand.Enabled = false;

                IVsHierarchy project = null;
                IVsSolution solution = null;
                uint itemid = VSConstants.VSITEMID_NIL;

                if (!TryGetSelectedItem(out solution, out project, out itemid))
                    return;

                // then check if the file has extension '.breezeinfo'
                string itemFullPath = _GetItemFullPath(project, itemid);
                string itemExtension = new FileInfo(itemFullPath).Extension;
                bool isBreezeTypeDef = string.Compare(".breezeinfo", itemExtension, StringComparison.OrdinalIgnoreCase) == 0;

                // if not leave the menu hidden
                if (!isBreezeTypeDef)
                    return;

                menuCommand.Visible = true;
                menuCommand.Enabled = true;
            }
        }
        #endregion

        private void AddGeneratedFiles(string sourceFile, IList<string> generatedFiles, IVsHierarchy project, uint itemid)
        {
            // see http://www.diaryofaninja.com/blog/2014/02/18/who-said-building-visual-studio-extensions-was-hard
            // see http://www.codeproject.com/Articles/688939/Visual-Studio-Custom-Tools-Do-It-Smarter

            foreach (var generatedFile in generatedFiles)
            {
                VSADDRESULT[] result = new VSADDRESULT[1];
                ((IVsProject)project)
                    .AddItem(
                        itemid,
                        VSADDITEMOPERATION.VSADDITEMOP_OPENFILE,
                        sourceFile,
                        1,
                        new string[1] { generatedFile },
                        IntPtr.Zero,
                        result
                    );

                uint nNewItemId = VSConstants.VSITEMID_NIL;
                project.ParseCanonicalName(generatedFile, out nNewItemId);

                var propertyStorage = (IVsBuildPropertyStorage)project;
                propertyStorage.SetItemAttribute(nNewItemId, "DependentUpon", Path.GetFileName(sourceFile));

                //Microsoft.Build.Evaluation.ProjectItem oItem = oBuildProject.Items.Where(item => item.EvaluatedInclude.EndsWith(Path.GetFileName(szItemPath))).Single();
                //Microsoft.Build.Evaluation.ProjectItem oNewItem = oBuildProject.Items.Where(item => item.EvaluatedInclude.EndsWith(Path.GetFileName(szNewItemPath))).Single();

                //oNewItem.ItemType = oItem.ItemType;
            }
        }

        #region Utils
        private static bool TryGetSelectedItem(out IVsSolution solution, out IVsHierarchy project, out uint itemid)
        {
            project = null;
            itemid = VSConstants.VSITEMID_NIL;
            int hr = VSConstants.S_OK;

            var monitorSelection = Package.GetGlobalService(typeof(SVsShellMonitorSelection)) as IVsMonitorSelection;
            solution = Package.GetGlobalService(typeof(SVsSolution)) as IVsSolution;
            if (monitorSelection == null || solution == null)
            {
                return false;
            }

            IVsMultiItemSelect multiItemSelect = null;
            IntPtr hierarchyPtr = IntPtr.Zero;
            IntPtr selectionContainerPtr = IntPtr.Zero;

            try
            {
                hr = monitorSelection.GetCurrentSelection(out hierarchyPtr, out itemid, out multiItemSelect, out selectionContainerPtr);

                // Error: there is no selection
                if (ErrorHandler.Failed(hr) || hierarchyPtr == IntPtr.Zero || itemid == VSConstants.VSITEMID_NIL)
                {
                    return false;
                }

                // Error: multiple items are selected
                if (multiItemSelect != null)
                {
                    return false;
                }

                // Error: selection is not an item (but eg. a project)
                if (itemid == VSConstants.VSITEMID_ROOT)
                {
                    return false;
                }

                project = Marshal.GetObjectForIUnknown(hierarchyPtr) as IVsHierarchy;
                
                // Error: can't see when this would happen, but let's play it safe:
                if (project == null)
                {
                    return false;
                }

                // Error: hierarchy is not a project inside the Solution if it does not have a ProjectID Guid
                Guid guidProjectID = Guid.Empty;
                if (ErrorHandler.Failed(solution.GetGuidOfProject(project, out guidProjectID)))
                {
                    return false; 
                }

                // if we got this far then there is a single project item selected
                return true;
            }
            finally
            {
                if (selectionContainerPtr != IntPtr.Zero)
                {
                    Marshal.Release(selectionContainerPtr);
                }

                if (hierarchyPtr != IntPtr.Zero)
                {
                    Marshal.Release(hierarchyPtr);
                }
            }
        }

        private void _ReloadProject(IVsSolution solution, IVsHierarchy project)
        {
            // See http://www.visualstudioextensibility.com/2015/04/21/mz-tools-articles-series-howto-unloadreload-a-project-from-a-visual-studio-package/
            var projectGuid = GetProjectGuid(project);

            _SaveProject(solution, project);
            _UnloadProject(solution, projectGuid);
            _LoadProject(solution, projectGuid);
        }

        private const uint VSITEMID_ROOT = 0xFFFFFFFE;
        private Guid GetProjectGuid(IVsHierarchy project)
        {
            Guid projectGuid;

            ErrorHandler.ThrowOnFailure(
                project.GetGuidProperty(VSITEMID_ROOT, (int)__VSHPROPID.VSHPROPID_ProjectIDGuid, out projectGuid)
            );

            return projectGuid;
        }

        private void _SaveProject(IVsSolution solution, IVsHierarchy project)
        {
            ErrorHandler.ThrowOnFailure(
                solution
                .SaveSolutionElement(
                    (uint)(__VSSLNSAVEOPTIONS.SLNSAVEOPT_SkipSolution), // | __VSSLNSAVEOPTIONS.SLNSAVEOPT_SkipDocs),
                    project,
                    0
                )
            );
        }

        private void _UnloadProject(IVsSolution solution, Guid projectGuid)
        {
            ErrorHandler.ThrowOnFailure(
                ((IVsSolution4)solution)
                .UnloadProject(ref projectGuid, (uint)_VSProjectUnloadStatus.UNLOADSTATUS_UnloadedByUser)
            );
        }

        private void _LoadProject(IVsSolution solution, Guid projectGuid)
        {
            ErrorHandler.ThrowOnFailure(
                ((IVsSolution4)solution)
                .ReloadProject(ref projectGuid)
            );
        }

        private string _GetItemFullPath(IVsHierarchy project, uint itemid)
        {
            string itemFullPath = null;

            ErrorHandler.ThrowOnFailure(
                ((IVsProject)project)
                .GetMkDocument(itemid, out itemFullPath)
            );

            return itemFullPath;
        }

        #endregion
    }
}
