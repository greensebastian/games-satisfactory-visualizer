import { writeFileSync } from 'fs';
import docs from './lib/docs.json' with { type: "json" };

const output = {}

const specialCharacters = /[^a-zA-Z0-9]/g

for(const type of docs){
  const className = type.NativeClass.split('.').at(-1).replaceAll(specialCharacters, "")
  output[className] ??= {}
  for(const instance of type.Classes){
    const instanceName = instance.ClassName.replaceAll(specialCharacters, "")
    output[className][instanceName] = instance
  }
}

writeFileSync('./lib/typedDocs.json', JSON.stringify(output, null, 2))