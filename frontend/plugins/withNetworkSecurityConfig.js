// plugins/withNetworkSecurityConfig.js
//
// Why this exists:
// `android.usesCleartextTraffic: true` in app.json is a blunt, app-wide flag.
// It's supposed to cover both axios/fetch calls AND <Image> loading, but in
// practice it only reliably applies if the native android/ project is fully
// regenerated from app.json (a clean `expo prebuild`). If a stale
// AndroidManifest.xml from before the flag was added is still lying around,
// or a bare/custom android/ folder was hand-edited at some point, the flag
// silently doesn't apply — which is exactly the "backend calls / images work
// on Wi-Fi but fail on Android" symptom you're seeing.
//
// This plugin is a more explicit, harder-to-silently-break alternative: it
// writes an actual Network Security Config XML file that allow-lists
// cleartext (http://) traffic, and wires it into AndroidManifest.xml
// directly via the Expo Config Plugin API — so it's regenerated correctly
// on every `expo prebuild`, and used by *both* your networking library and
// React Native's Android image loader (which honors the same OS-level
// Network Security Config).
//
// Usage in app.json:
//   "plugins": [
//     ["./plugins/withNetworkSecurityConfig", { "domains": ["192.168.1.3"] }]
//   ]
//
// Pass the LAN IP(s) / hostnames your backend runs on. You can list more
// than one if your dev machine's IP changes between networks.

const {
    withAndroidManifest,
    withDangerousMod,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE_NAME = 'network_security_config.xml';

function buildConfigXml(domains) {
    const domainEntries = domains
        .map(
            (domain) =>
                `        <domain includeSubdomains="true">${domain}</domain>`
        )
        .join('\n');

    return `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
${domainEntries}
    </domain-config>
</network-security-config>
`;
}

function withNetworkSecurityConfigXml(config, { domains }) {
    return withDangerousMod(config, [
        'android',
        async (config) => {
            const xmlDir = path.join(
                config.modRequest.platformProjectRoot,
                'app/src/main/res/xml'
            );
            fs.mkdirSync(xmlDir, { recursive: true });
            fs.writeFileSync(
                path.join(xmlDir, CONFIG_FILE_NAME),
                buildConfigXml(domains)
            );
            return config;
        },
    ]);
}

function withNetworkSecurityConfigManifest(config) {
    return withAndroidManifest(config, (config) => {
        const application = config.modResults.manifest.application?.[0];
        if (!application) return config;

        application.$['android:networkSecurityConfig'] =
            '@xml/network_security_config';
        // Keep this true as a fallback for anything the NSC doesn't cover.
        application.$['android:usesCleartextTraffic'] = 'true';

        return config;
    });
}

module.exports = function withNetworkSecurityConfig(config, options = {}) {
    const domains = options.domains || [];
    if (domains.length === 0) {
        console.warn(
            'withNetworkSecurityConfig: no domains provided — pass your backend LAN IP, e.g. ["192.168.1.3"]'
        );
    }

    config = withNetworkSecurityConfigXml(config, { domains });
    config = withNetworkSecurityConfigManifest(config);
    return config;
};