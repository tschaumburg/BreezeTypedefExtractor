//------------------------------------------------------------------------------
// <copyright file="AddToReferencesCommand.cs" company="Company">
//     Copyright (c) Company.  All rights reserved.
// </copyright>
//------------------------------------------------------------------------------

using System;
using System.ComponentModel.Design;
using System.Globalization;
using Microsoft.VisualStudio.Shell;
using Microsoft.VisualStudio.Shell.Interop;
using BreezeTypeDefs.Commands;

namespace BreezeTypeDefs
{
    /// <summary>
    /// Command handler
    /// </summary>
    internal sealed class AddToReferencesCommand : AddCommandBase
    {
        /// <summary>
        /// Command ID.
        /// </summary>
        public const int CommandId = 256;

        /// <summary>
        /// Command menu group (command set GUID).
        /// </summary>
        public static readonly Guid CommandSet = new Guid("ea0c7fda-2dab-4b33-9548-74e58440a65e");

        /// <summary>
        /// Gets the instance of the command.
        /// </summary>
        public static AddToReferencesCommand Instance
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
            Instance = new AddToReferencesCommand(package);
        }

        public AddToReferencesCommand(Package package)
            :base(package, CommandSet, CommandId )
        {
        }
    }
}
