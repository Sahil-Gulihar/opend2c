import { createGET } from "next-llms-generator/route";

export const GET = createGET({
  generatorOptions: {
    siteUrl: "http://graycup.org/",
    enableRecursiveDiscovery: true,
  },
});
