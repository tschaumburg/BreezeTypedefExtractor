using EdgeJs;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace BreezeGenerators
{
    public class BreezeGenerator
    {
        public static async Task<List<string>> StartGeneration(string language, Dictionary<string, string> attributes, string sourceFilename, string metadataString, string serviceUrl)
        {
            // Find the generator script file...:
            var scriptPath = FindScript(Path.GetDirectoryName(sourceFilename), language);
            scriptPath = scriptPath.Replace('\\', '/');

            // ...prepare the parameterlist...:
            var jsonParameters = new JObject();
            jsonParameters.Add("sourceFile", sourceFilename); // old
            jsonParameters.Add("serviceName", Path.GetFileNameWithoutExtension(sourceFilename)); // new
            jsonParameters.Add("metadata", metadataString);
            jsonParameters.Add("serviceUrl", serviceUrl);

            // ...including additional attributes...:
            var jsonAttributes = new JObject();
            foreach (var kvp in attributes)
                jsonAttributes.Add(kvp.Key, kvp.Value);
            jsonParameters.Add("attributes", jsonAttributes);

            // ...feed the script to Edge...:
            var func = Edge.Func(@"return require('" + scriptPath + "')");
            var retVal = await func(jsonParameters.ToString()) as object[];

            // Get the list of filename+filecontents returned:
            List<string> filelist = new List<string>();
            if (retVal == null)
                return filelist;

            foreach (var res in retVal)
            {
                var fileInfo = res as IDictionary<string, object>;
                if (fileInfo != null)
                {
                    object filename = null;
                    if (!fileInfo.TryGetValue("filename", out filename))
                        throw new ApplicationException("Expected .filename");
                    
                    object contents = null;
                    if (!fileInfo.TryGetValue("contents", out contents))
                        throw new ApplicationException("Expected .contents");

                    File.WriteAllText(filename.ToString(), contents.ToString());
                    filelist.Add(filename.ToString());
                }
            }

            if (attributes.ContainsKey("proxyname"))
            {
                string breezeextenionsFilename = Path.Combine(Path.GetDirectoryName(sourceFilename), "breezeextensions.ts");
                string breezeextensionsContents = GetEmbeddedResource("breezeextensions.ts");
                File.WriteAllText(breezeextenionsFilename, breezeextensionsContents);
                filelist.Add(breezeextenionsFilename);
            }

            return filelist;
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

        private static string FindScript(string breezeinfoDir, string language)
        {
            var scriptFile = "generate" + language.ToLower() + ".js";

            // Look for customized generator next to the .breezeinfo file
            var customizedScriptPath = Path.Combine(breezeinfoDir, scriptFile);
            if (File.Exists(customizedScriptPath))
                return customizedScriptPath;

            // Then look for the standard generator distributed with this extension:
            var thisDllFullname = Assembly.GetExecutingAssembly().Location;
            var thisDllDirname = Path.GetDirectoryName(thisDllFullname);
            var standardScriptPath = Path.Combine(thisDllDirname, scriptFile);
            if (File.Exists(standardScriptPath))
                return standardScriptPath;

            // Leave it to the Javascript engine:
            return scriptFile;
        }
    }
}
