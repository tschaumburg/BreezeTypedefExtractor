using Microsoft.VisualStudio;
using Microsoft.VisualStudio.Shell;
using Microsoft.VisualStudio.Shell.Interop;
using System;
using System.ComponentModel.Design;
using System.IO;
using System.Runtime.InteropServices;

namespace BreezeTypeDefs.Commands
{
    class AddCommandBase
    {
        /// <summary>
        /// VS Package that provides this command, not null.
        /// </summary>
        private readonly Package package;

        /// <summary>
        /// Initializes a new instance of the <see cref="AddToProjectCommand"/> class.
        /// Adds our command handlers for menu (commands must exist in the command table file)
        /// </summary>
        /// <param name="package">Owner package, not null.</param>
        protected AddCommandBase(Package package, Guid commandSet, int commandId)
        {
            if (package == null)
            {
                throw new ArgumentNullException("package");
            }

            this.package = package;

            OleMenuCommandService commandService = this.ServiceProvider.GetService(typeof(IMenuCommandService)) as OleMenuCommandService;
            if (commandService != null)
            {
                var menuCommandID = new CommandID(commandSet, commandId);

                //var menuItem = new MenuCommand(this.MenuItemCallback, menuCommandID);
                var menuItem = new OleMenuCommand(MenuItemCallback, menuCommandID);
                menuItem.BeforeQueryStatus += menuCommand_BeforeQueryStatus;

                commandService.AddCommand(menuItem);
            }
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

                var show = IsMenuEnabled(solution, project, itemid);

                //// if not leave the menu hidden
                //if (!show)
                //    return;

                menuCommand.Visible = show;
                menuCommand.Enabled = show;
            }
        }

        protected virtual bool IsMenuEnabled(IVsSolution solution, IVsHierarchy project, uint itemid)
        {
            return true;
        }

        /// <summary>
        /// This function is the callback used to execute the command when the menu item is clicked.
        /// See the constructor to see how the menu item is associated with this function using
        /// OleMenuCommandService service and MenuCommand class.
        /// </summary>
        /// <param name="sender">Event sender.</param>
        /// <param name="e">Event args.</param>
        private void MenuItemCallback(object sender, EventArgs e)
        {
            try
            {
                IVsSolution solution = null;
                IVsHierarchy project = null;
                uint itemid = VSConstants.VSITEMID_NIL;

                if (!TryGetSelectedItem(out solution, out project, out itemid))
                    return;

                // Create the "breeze references" folder if it' not already there:
                var breezeFolder = AddFolder(project, "Breeze references");

                // Make file:
                foreach (var kvp in TemplateWizard.Wizard.CreateBreezeReference())
                {
                    var basename = kvp.Key;
                    var contents = kvp.Value;
                    var tmp = Path.GetTempFileName();
                    File.WriteAllText(tmp, contents);
                    breezeFolder.ProjectItems.AddFromTemplate(tmp, basename + ".breezeinfo");
                }

                //VsShellUtilities.LogMessage("BreezeTypeDefs extension", info, __ACTIVITYLOG_ENTRYTYPE.ALE_INFORMATION);
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

        private static EnvDTE.ProjectItem AddFolder(IVsHierarchy project, string folderName)
        {
            // Get the directory to add to:
            string projectDirname = _GetItemFullPath(project, VSConstants.VSITEMID_ROOT);

            if (projectDirname == null)
                throw new ApplicationException("Cannot find the directory for project");

            if (File.Exists(projectDirname) == false)
                throw new ApplicationException("Project directory \"" + projectDirname + "\" doesn't seem to exist. Odd...");

            if (File.GetAttributes(projectDirname).HasFlag(FileAttributes.Directory) == false)
                projectDirname = Path.GetDirectoryName(projectDirname);

            if (File.GetAttributes(projectDirname).HasFlag(FileAttributes.Directory) == false)
                throw new ApplicationException("Project directory \"" + projectDirname + "\" doesn't seem to exist. Odd...");

            var envProject = GetEnvProject(project);
            for (var n = 1; n <= envProject.ProjectItems.Count; n++) // COM indexing is 1-based!
            {
                var item = envProject.ProjectItems.Item(n);
                if (folderName.Equals(item.Name))
                    return item;
                //return Path.Combine(projectDirname, folderName);
            }
            var folder = envProject.ProjectItems.AddFolder(folderName);
            return folder;
            //return Path.Combine(projectDirname, folderName);
        }

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
                if (ErrorHandler.Failed(hr) || hierarchyPtr == IntPtr.Zero)//|| itemid == VSConstants.VSITEMID_NIL)
                {
                    return false;
                }

                // Error: multiple items are selected
                if (multiItemSelect != null)
                {
                    return false;
                }

                //// Error: selection is not an item (but eg. a project)
                //if (itemid == VSConstants.VSITEMID_ROOT)
                //{
                //    return false;
                //}

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

        protected static string _GetItemFullPath(IVsHierarchy project, uint itemid)
        {
            string itemFullPath = null;

            ErrorHandler.ThrowOnFailure(
                ((IVsProject)project)
                .GetMkDocument(itemid, out itemFullPath)
            );

            return itemFullPath;
        }

        //    // see http://www.diaryofaninja.com/blog/2014/02/18/who-said-building-visual-studio-extensions-was-hard
        //    // see http://www.codeproject.com/Articles/688939/Visual-Studio-Custom-Tools-Do-It-Smarter

        private static EnvDTE.Project GetEnvProject(IVsHierarchy vsHierarchy)
        {
            object objProj;
            vsHierarchy.GetProperty((uint)VSConstants.VSITEMID_ROOT, (int)__VSHPROPID.VSHPROPID_ExtObject, out objProj);
            return (EnvDTE.Project)objProj;
        }

        private static string GetMessages(Exception exc)
        {
            if (exc is AggregateException)
            {
                var aggr = exc as AggregateException;
                string res = "";
                foreach (var inner in aggr.InnerExceptions)
                {
                    res = res + GetMessages(inner);
                }

                return res;
            }

            return exc.Message + Environment.NewLine;
        }
    }
}
