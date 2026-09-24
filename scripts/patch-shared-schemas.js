/**
 * Pre/Post-install patch to ensure @insforge/shared-schemas exports
 * are compatible with Node.js CommonJS module resolution.
 *
 * Root Cause:
 * The published @insforge/shared-schemas package has `"type": "module"` and its
 * `"exports"` field only declares `"import"`. When `@insforge/sdk` (CommonJS bundle)
 * calls `require("@insforge/shared-schemas")`, Node.js throws:
 *   Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: No "exports" main defined in ...
 *
 * This script ensures the package.json has `"require"` and `"default"` mapped to `./dist/index.js`.
 */

const fs = require('fs');
const path = require('path');

function patchSharedSchemas() {
    const candidatePaths = [
        path.join(__dirname, '../node_modules/@insforge/shared-schemas/package.json'),
        path.join(process.cwd(), 'node_modules/@insforge/shared-schemas/package.json')
    ];

    for (const pkgPath of candidatePaths) {
        if (fs.existsSync(pkgPath)) {
            try {
                const raw = fs.readFileSync(pkgPath, 'utf8');
                const pkg = JSON.parse(raw);
                let modified = false;

                if (!pkg.exports) {
                    pkg.exports = {
                        '.': {
                            types: './dist/index.d.ts',
                            import: './dist/index.js',
                            require: './dist/index.js',
                            default: './dist/index.js'
                        }
                    };
                    modified = true;
                } else if (pkg.exports['.']) {
                    if (typeof pkg.exports['.'] === 'object') {
                        if (!pkg.exports['.'].require) {
                            pkg.exports['.'].require = './dist/index.js';
                            modified = true;
                        }
                        if (!pkg.exports['.'].default) {
                            pkg.exports['.'].default = './dist/index.js';
                            modified = true;
                        }
                    }
                }

                if (modified) {
                    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
                    console.log(`[GarageFlow] Successfully patched @insforge/shared-schemas for CommonJS compatibility at: ${pkgPath}`);
                }
            } catch (err) {
                console.warn(`[GarageFlow] Warning: Could not patch ${pkgPath}:`, err.message);
            }
        }
    }
}

patchSharedSchemas();

module.exports = patchSharedSchemas;
