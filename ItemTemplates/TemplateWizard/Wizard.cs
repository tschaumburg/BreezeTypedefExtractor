using Microsoft.VisualStudio.TemplateWizard;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EnvDTE;
using System.Reflection;
using System.IO;

namespace TemplateWizard
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

        public static Dictionary<string, string> CreateBreezeReference()
        {
            var wizardDlg = new BreezeinfoWizardWindow();
            var template = GetEmbeddedResource("template.breezeinfo");

            //  Show the form.
            wizardDlg.ShowDialog();

            template = template.Replace("$MetadataUrl$", wizardDlg.MetadataUrl);
            template = template.Replace("$OutputLanguage$", wizardDlg.OutputLanguage);
            template = template.Replace("$TypescriptFramework$", wizardDlg.TypescriptFramework);
            template = template.Replace("$TypescriptNamespace$", wizardDlg.TypescriptNamespace);
            var name = wizardDlg.ReferenceName; ;

            return new Dictionary<string, string> { { name, template } };
        }

        private static string GetEmbeddedResource(string filename)
        {
            var assembly = Assembly.GetExecutingAssembly();
            var resourceName = assembly.GetName().Name + "." + filename;

            using (Stream stream = assembly.GetManifestResourceStream(resourceName))
            using (StreamReader reader = new StreamReader(stream))
            {
                return reader.ReadToEnd();
            }
        }

    }
}
