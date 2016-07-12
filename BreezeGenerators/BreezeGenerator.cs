using EdgeJs;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BreezeGenerators
{
    public class BreezeGenerator
    {
        public static async Task<List<string>> StartGeneration(string language, Dictionary<string, string> attributes, string sourceFilename, string metadataString)
        {
            // Find the generator script file:
            var scriptPath = FindScript(Path.GetDirectoryName(sourceFilename), language);
            scriptPath = scriptPath.Replace('\\', '/');
            var func = Edge.Func(@"return require('" + scriptPath + "')");

            // Prepare the parameters:
            var jsonParameters = new JObject();
            jsonParameters.Add("sourceFile", sourceFilename);
            jsonParameters.Add("metadata", metadataString);
            // add additional attributes:
            var jsonAttributes = new JObject();
            foreach (var kvp in attributes)
                jsonAttributes.Add(kvp.Key, kvp.Value);
            jsonParameters.Add("attributes", jsonAttributes);

            // Call the generator script:
            var retVal = await func(jsonParameters.ToString()) as object[];

            // Write the files:
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

            return filelist;
        }

        private static string FindScript(string breezeinfoDir, string language)
        {
            language = language.Substring(0, 1).ToUpper() + language.Substring(1); // typescript => Typescript
            var scriptFile = "Generate" + language + ".js";

            // Look for customized generator next to the .breezeinfo file
            var customizedScriptPath = Path.Combine(breezeinfoDir, scriptFile);
            if (File.Exists(customizedScriptPath))
                return customizedScriptPath;

            // Then look for the standard generator distributed with this extension:
            var standardScriptPath = Path.Combine(Directory.GetCurrentDirectory(), scriptFile);
            if (File.Exists(standardScriptPath))
                return standardScriptPath;

            // Leave it to the Javascript engine:
            return scriptFile;
        }
    }
}
