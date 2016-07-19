using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

namespace TemplateWizard
{
    /// <summary>
    /// Interaction logic for BreezeinfoWizardWindow.xaml
    /// </summary>
    public partial class BreezeinfoWizardWindow : Window
    {
        private Brush standardBrush;

        public BreezeinfoWizardWindow()
        {
            InitializeComponent();
        }

        public string ReferenceName
        {
            get
            {
                return NameBox.Text; 
            }
        }
        public string MetadataUrl
        {
            get
            {
                return MetadataBox.Text;
            }
        }
        public string OutputLanguage
        {
            get
            {
                return "typescript";
            }
        }
        public string TypescriptFramework
        {
            get
            {
                return "None";// TypescriptFrameworkCombo.SelectedValue.ToString();
            }
        }
        public string TypescriptNamespace
        {
            get
            {
                return TypescriptNamespaceBox.Text;
            }
        }

        private void UpdateButtons()
        {
            bool complete = true;
            if (!VerifyMandatory(NameBox))
            {
                complete = false;
            }
            if (!VerifyMandatory(MetadataBox))
                complete = false;

            this.OKButton.IsEnabled = complete;
        }

        private bool VerifyMandatory(TextBox mandatory)
        {
            if (string.IsNullOrWhiteSpace(mandatory.Text))
            {
                mandatory.BorderBrush = new SolidColorBrush(Colors.Red);
                return false;
            }

            mandatory.BorderBrush = standardBrush; ;

            return true;
        }

        private void Button_Click(object sender, RoutedEventArgs e)
        {
            this.Close();
        }

        private void UpdateUI(object sender, TextChangedEventArgs e)
        {
            UpdateButtons();
        }

        protected override void OnInitialized(EventArgs e)
        {
            base.OnInitialized(e);
            standardBrush = this.NameBox.BorderBrush;
            UpdateButtons();
        }

        private void Button_Click_1(object sender, RoutedEventArgs e)
        {
            using (WebClient client = new WebClient())
            {
                using (Stream stream = client.OpenRead(this.MetadataUrl))
                {
                    using (StreamReader reader = new StreamReader(stream))
                    {
                        var metadata = reader.ReadToEnd();
                        if (string.IsNullOrWhiteSpace(metadata))
                            throw new ApplicationException("Metadata URL responded with malformed metadata");
                    }
                }
            }
        }
    }
}
