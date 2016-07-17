using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Xml;
using BreezeGenerators;

namespace BreezeTypeDefs.Generators
{
    public class BreezeTypeDefGenerator
    {
        public static async Task<IList<string>> GenerateOutputs(string breezeinfiFileName)
        {
            // Parse the input file (the xxx.breezeinfo file):
            // ================================================
            XmlDocument breezeinfo = null;
            try
            {
                breezeinfo = new XmlDocument();
                breezeinfo.Load(breezeinfiFileName); //Load myservice.breezeinfo
            }
            catch (Exception e)
            {
                throw new ApplicationException("Error parsing file " + breezeinfiFileName, e);
            }

            // Get the Breeze server URL:
            // ==========================
            string breezeUrl = GetBreezeUrl(breezeinfo);
            if (string.IsNullOrWhiteSpace(breezeUrl))
            {
                throw new ApplicationException(breezeinfiFileName + ": No MetadataUrl specified");
            }

            // Preload the metadata:
            // =====================
            var metadataCacheFilename = Path.ChangeExtension(breezeinfiFileName, "metadata");
            var metadata = GetMetadata(metadataCacheFilename, breezeUrl);

            // Get the output elements:
            // ========================
            IEnumerable<XmlElement> outputs = GetOutputs(breezeinfo);

            // Call each of the generators requested in the breezeinfo:
            // ========================================================
            List<string> generatedFiles = new List<string>();
            foreach (XmlNode generatorElement in outputs)//breezeinfo.GetElementsByTagName("Output"))
            {
                var language = generatorElement.LocalName;// GetLanguage(generatorElement);
                if (language == null)
                    throw new ApplicationException("Every Output element must have a language attribute");

                var serviceUrl = breezeUrl.Replace("/Metadata", "");
                var filelist = await BreezeGenerator.StartGeneration(language, GetAllAttributes(generatorElement), breezeinfiFileName, metadata, serviceUrl);
                generatedFiles.AddRange(filelist);
            }

            generatedFiles.Add(metadataCacheFilename);

            return generatedFiles;
        }

        private static IEnumerable<XmlElement> GetOutputs(XmlDocument breezeinfo)
        {
            foreach (XmlNode outputElement in breezeinfo.GetElementsByTagName("Output"))
            {
                foreach (XmlNode generatorElement in outputElement.ChildNodes)
                {
                    if (generatorElement is XmlElement)
                        yield return generatorElement as XmlElement;
                }
            }

            yield break;
        }

        private static string GetBreezeUrl(XmlDocument breezeInfo)
        {
            var urlElementList = breezeInfo.GetElementsByTagName("MetadataUrl");
            if (urlElementList == null || urlElementList.Count != 1)
                return null;

            var urlElement = urlElementList[0] as XmlElement;
            if (urlElement == null)
                return null;

            var breezeUrl = urlElement.InnerText.Trim();
            if (string.IsNullOrWhiteSpace(breezeUrl))
                return null;

            return breezeUrl;
        }

        private static string GetMetadata(string cacheFilename, string url)
        {
            try
            {
                using (WebClient client = new WebClient())
                {
                    using (Stream stream = client.OpenRead(url))
                    {
                        using (StreamReader reader = new StreamReader(stream))
                        {
                            var metadata = reader.ReadToEnd();
                            File.WriteAllText(cacheFilename, metadata);
                            return metadata;
                        }
                    }
                }
            }
            catch (Exception e)
            {
                if (!File.Exists(cacheFilename))
                    throw new AggregateException("Error trying to load metadata from " + url, e);

                return File.ReadAllText(cacheFilename);
            }
        }

        private static string GetLanguage(XmlNode outputElement)
        {
            var languageAttr = outputElement.Attributes.GetNamedItem("language") as XmlAttribute;

            if (languageAttr == null)
                throw new ApplicationException("Every Output element must have a language attribute");

            if (string.IsNullOrWhiteSpace(languageAttr.Value))
                throw new ApplicationException("Every Output element must have a non-empty language attribute");

            return languageAttr.Value;
        }

        private static Dictionary<string, string> GetAllAttributes(XmlNode outputelement)
        {
            var result = new Dictionary<string, string>();
            for (var n=0; n <outputelement.Attributes.Count; n++)
            {
                var attr = outputelement.Attributes[n];
                result.Add(attr.Name, attr.Value);
            }
            return result;
        }
    }
}
