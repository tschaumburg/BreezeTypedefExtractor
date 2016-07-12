using Microsoft.VisualStudio.TemplateWizard;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EnvDTE;

namespace BreezeInfoWizard
{
    public class Wizard : IWizard
    {
        public void BeforeOpeningFile(ProjectItem projectItem)
        {
        }

        public void ProjectFinishedGenerating(Project project)
        {
        }

        public void ProjectItemFinishedGenerating(ProjectItem projectItem)
        {
        }

        public void RunFinished()
        {
        }

        public void RunStarted(object automationObject, Dictionary<string, string> replacementsDictionary, WizardRunKind runKind, object[] customParams)
        {
            var wizardDlg = new BreezeinfoWizardWindow();

            //  Show the form.
            wizardDlg.ShowDialog();

            //  Add the options to the replacementsDictionary.
            replacementsDictionary.Add("$MetadataUrl$", wizardDlg.MetadataUrl);
            replacementsDictionary.Add("$OutputLanguage$", wizardDlg.OutputLanguage);
            replacementsDictionary.Add("$TypescriptFramework$", wizardDlg.TypescriptFramework);
            replacementsDictionary.Add("$TypescriptNamespace$", wizardDlg.TypescriptNamespace);
        }

        public bool ShouldAddProjectItem(string filePath)
        {
            return true;
        }
    }
}
