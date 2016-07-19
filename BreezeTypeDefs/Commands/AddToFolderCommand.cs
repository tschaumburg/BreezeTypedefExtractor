//------------------------------------------------------------------------------
// <copyright file="AddToFolderCommand.cs" company="Company">
//     Copyright (c) Company.  All rights reserved.
// </copyright>
//------------------------------------------------------------------------------

using System;
using System.ComponentModel.Design;
using System.Globalization;
using Microsoft.VisualStudio.Shell;
using Microsoft.VisualStudio.Shell.Interop;
using BreezeTypeDefs.Commands;
using Microsoft.VisualStudio;

namespace BreezeTypeDefs
{
    /// <summary>
    /// Command handler
    /// </summary>
    internal sealed class AddToFolderCommand: AddCommandBase
    {
        /// <summary>
        /// Command ID.
        /// </summary>
        public const int CommandId = 256;

        /// <summary>
        /// Command menu group (command set GUID).
        /// </summary>
        public static readonly Guid CommandSet = new Guid("56d15f6a-5a8f-4a9e-8352-a86a3b2c6237");

        /// <summary>
        /// Gets the instance of the command.
        /// </summary>
        public static AddToFolderCommand Instance
        {
            get;
            private set;
        }

        /// <summary>
        /// Initializes the singleton instance of the command.
        /// </summary>
        /// <param name="package">Owner package, not null.</param>
        public static void Initialize(Package package)
        {
            Instance = new AddToFolderCommand(package);
        }

        public AddToFolderCommand(Package package)
            :base(package, CommandSet, CommandId )
        {
        }

        protected override bool IsMenuEnabled(IVsSolution solution, IVsHierarchy project, uint itemid)
        {
            // then check if the file has extension '.breezeinfo'
            string itemFullPath = _GetItemFullPath(project, itemid).TrimEnd('\\');

            if (itemFullPath == null)
                return false;

            bool isBreezeTypeDef = itemFullPath.EndsWith("Breeze references");

            return isBreezeTypeDef;
        }

        
    }
}
