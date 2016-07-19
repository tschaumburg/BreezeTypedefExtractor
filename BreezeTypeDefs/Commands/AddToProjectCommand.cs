//------------------------------------------------------------------------------
// <copyright file="AddCommand.cs" company="Company">
//     Copyright (c) Company.  All rights reserved.
// </copyright>
//------------------------------------------------------------------------------

using System;
using System.ComponentModel.Design;
using System.Globalization;
using Microsoft.VisualStudio.Shell;
using Microsoft.VisualStudio.Shell.Interop;
using Microsoft.VisualStudio;
using System.Runtime.InteropServices;
using System.IO;
using BreezeTypeDefs.Commands;

namespace BreezeTypeDefs
{
    /// <summary>
    /// Command handler
    /// </summary>
    internal sealed class AddToProjectCommand: AddCommandBase
    {
        /// <summary>
        /// Command ID.
        /// </summary>
        public const int CommandId = 256;

        /// <summary>
        /// Command menu group (command set GUID).
        /// </summary>
        public static readonly Guid CommandSet = new Guid("92e3e96c-1f2a-49ed-99f4-a3a0987a2993");

        /// <summary>
        /// Gets the instance of the command.
        /// </summary>
        public static AddToProjectCommand Instance
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
            Instance = new AddToProjectCommand(package);
        }

        public AddToProjectCommand(Package package)
            :base(package, CommandSet, CommandId )
        {
        }
    }
}
