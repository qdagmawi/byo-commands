const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const output = path.resolve(process.argv[2] || path.join(root, 'windows-build'));
if (fs.existsSync(output)) throw new Error('Choose a fresh output directory.');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (manifest.commands.some(command => command.name.startsWith('custom-ai-'))) throw new Error('Use sanitized release staging, not your live personal manifest.');
const sdkRequire = createRequire(require.resolve('@raycast/api/package.json'));
const esbuild = sdkRequire('esbuild');
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const result = await esbuild.build({
    entryPoints: manifest.commands.map(command => path.join(root, 'src', command.name + '.tsx')),
    outdir: output,
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'cjs',
    minify: true,
    sourcemap: false,
    metafile: true,
    legalComments: 'eof',
    external: ['@raycast/api', 'react', 'react/jsx-runtime'],
    logLevel: 'warning',
  });
  const builtins = new Set(require('node:module').builtinModules.flatMap(name => [name, 'node:' + name]));
  for (const file of Object.values(result.metafile.outputs)) for (const imported of file.imports) {
    if (imported.external && !['@raycast/api', 'react', 'react/jsx-runtime'].includes(imported.path) && !builtins.has(imported.path)) {
      throw new Error('Unbundled dependency: ' + imported.path);
    }
  }
  fs.cpSync(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true, filter: file => path.basename(file) !== 'local-project.json' });
  delete manifest.scripts;
  delete manifest.devDependencies;
  fs.writeFileSync(path.join(output, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log('Built ' + manifest.commands.length + ' self-contained commands for folder import: ' + output);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
