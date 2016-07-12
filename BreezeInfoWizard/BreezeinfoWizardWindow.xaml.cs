using System;
using System.Collections.Generic;
using System.Linq;
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

namespace BreezeInfoWizard
{
    /// <summary>
    /// Interaction logic for BreezeinfoWizardWindow.xaml
    /// </summary>
    public partial class BreezeinfoWizardWindow : Window
    {
        public BreezeinfoWizardWindow()
        {
            InitializeComponent();
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
                return TypescriptFrameworkCombo.SelectedValue.ToString();
            }
        }
        public string TypescriptNamespace
        {
            get
            {
                return TypescriptNamespaceBox.Text;
            }
        }

        private void Button_Click(object sender, RoutedEventArgs e)
        {
            this.Close();
        }
    }
}
