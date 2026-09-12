import { Resolver } from 'node:dns/promises';
import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';

/**
 * Asks the live site whether it is there, by name, over the network, from a
 * machine that is not the one complaining.
 *
 * Everything else in this repository proves the build is good. Nothing proved
 * the site was up. That gap is the reason an `ERR_CONNECTION_CLOSED` on
 * www.leer.nu could only ever be answered with a guess: by the time anyone
 * looked the site was answering again, and no run anywhere had recorded
 * whether it had ever stopped.
 *
 * The error itself sits below the app. The browser opened a connection and the
 * other end closed it before one byte of HTTP came back, so no React and no
 * asset can cause it and none can fix it. What can be done is to look often
 * enough, and to write down what was true at that minute — the DNS, the
 * certificate, the bytes — so the next report is a timestamp and a cause
 * rather than a screenshot.
 *
 * What it checks:
 *
 *   - DNS. `www` is a CNAME onto the Pages host, the apex carries GitHub's
 *     four addresses, and both are asked for in both families: the address a
 *     child's browser picks is often not the one a person checking by hand
 *     sees.
 *   - The certificate on every address, and how long it has left. Also when it
 *     was issued: a certificate minted in the last day means the custom domain
 *     was taken off and put back, and the window while it is re-issued is
 *     exactly a closed connection.
 *   - The page, over every address separately. Pages answers from four edges;
 *     one of them being wrong is invisible to anything that resolves once.
 *   - The assets index.html asks for. A wrong base (BASE_PATH in the deploy
 *     job) serves 404.html in the script's place — status 200, content type
 *     text/html, and a white screen for the child. This is the check that
 *     would catch it.
 *   - The redirects: http to https, and the apex to www.
 *
 * `--dns-only` stops after the DNS, for a machine that cannot reach the site
 * but can still resolve it.
 *
 * A warning does not fail the run. Warnings are the things that are wrong but
 * were wrong yesterday as well; a check that is permanently red is a check
 * nobody reads.
 */

const SITE = process.env.SITE_HOST ?? 'www.leer.nu';
const APEX = process.env.APEX_HOST ?? 'leer.nu';
const PAGES_HOST = process.env.PAGES_HOST ?? 'omelei.github.io';
const CHALLENGE = process.env.PAGES_CHALLENGE ?? `_github-pages-challenge-omelei.${APEX}`;

const TIMEOUT_MS = 10_000;
// Let's Encrypt renews with a month to spare, so two weeks left means the
// renewal has already failed twice rather than "it is getting close".
const CERT_WARN_DAYS = 14;
const FRESH_CERT_HOURS = 24;

// GitHub's published addresses for an apex domain.
const APEX_A = ['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153'];
const APEX_AAAA = [
  '2606:50c0:8000::153',
  '2606:50c0:8001::153',
  '2606:50c0:8002::153',
  '2606:50c0:8003::153',
];

const lines = [];
let failures = 0;
let warnings = 0;

function ok(text) {
  lines.push(`ok    ${text}`);
}

function warn(text) {
  warnings += 1;
  lines.push(`WARN  ${text}`);
}

function fail(text) {
  failures += 1;
  lines.push(`FAIL  ${text}`);
}

const resolver = new Resolver({ timeout: 5000, tries: 2 });

/** A lookup that has no answer is an answer: an empty list, not a crash. */
async function lookup(promise) {
  try {
    return await promise;
  } catch {
    return [];
  }
}

function fetchOverAddress({ address, host, path = '/', protocol = 'https' }) {
  return new Promise((resolve, reject) => {
    const options = {
      host: address,
      family: address.includes(':') ? 6 : 4,
      port: protocol === 'https' ? 443 : 80,
      path,
      method: 'GET',
      // The address is pinned and the name travels in the header and the SNI,
      // which is the only way to ask one edge node rather than whichever one
      // the resolver feels like handing out.
      headers: { host, 'user-agent': 'leernu-beschikbaarheid', 'accept-encoding': 'identity' },
      timeout: TIMEOUT_MS,
    };
    if (protocol === 'https') options.servername = host;

    const send = protocol === 'https' ? httpsRequest : httpRequest;
    const req = send(options, (res) => {
      const cert =
        typeof res.socket.getPeerCertificate === 'function'
          ? res.socket.getPeerCertificate()
          : null;
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        // Enough to read index.html and to know an asset arrived; not enough
        // to hold a megabyte of geodata in memory for no reason.
        if (body.length < 200_000) body += chunk;
      });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body, cert }));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error(`no answer within ${TIMEOUT_MS} ms`)));
    req.on('error', reject);
    req.end();
  });
}

function describeError(err) {
  return `${err.message}${err.code ? ` (${err.code})` : ''}`;
}

function checkCertificate(label, cert) {
  if (!cert || !cert.valid_to) {
    warn(`${label}: the connection reported no certificate`);
    return;
  }
  const until = new Date(cert.valid_to);
  const since = new Date(cert.valid_from);
  const daysLeft = Math.floor((until.getTime() - Date.now()) / 86_400_000);
  const issuer = cert.issuer?.O ?? cert.issuer?.CN ?? 'unknown issuer';
  const subject = cert.subject?.CN ?? '(no common name)';
  const line = `${label}: certificate for ${subject} from ${issuer}, issued ${cert.valid_from}, ${daysLeft} days left`;

  if (daysLeft < 0) fail(line);
  else if (daysLeft < CERT_WARN_DAYS) warn(line);
  else ok(line);

  const hoursOld = (Date.now() - since.getTime()) / 3_600_000;
  if (hoursOld >= 0 && hoursOld < FRESH_CERT_HOURS) {
    warn(
      `${label}: this certificate is ${Math.round(hoursOld)} hours old. GitHub issues a new one when the custom domain is removed and added again, and the site answers no connection at all while it does. If nobody touched the Pages settings, something else did.`,
    );
  }
}

/** The scripts and stylesheets index.html asks for, in the order it asks. */
function assetsOf(html) {
  return [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((match) => match[1]);
}

function expectedType(url) {
  return url.endsWith('.js') ? 'javascript' : 'css';
}

async function checkDns() {
  const cname = await lookup(resolver.resolveCname(SITE));
  if (cname.includes(PAGES_HOST)) ok(`${SITE} is a CNAME onto ${PAGES_HOST}`);
  else if (cname.length === 0)
    fail(`${SITE} has no CNAME record; it should point at ${PAGES_HOST}`);
  else fail(`${SITE} is a CNAME onto ${cname.join(', ')} rather than ${PAGES_HOST}`);

  const siteA = await lookup(resolver.resolve4(SITE));
  const siteAAAA = await lookup(resolver.resolve6(SITE));
  if (siteA.length === 0) fail(`${SITE} resolves to no IPv4 address`);
  else ok(`${SITE} IPv4: ${siteA.join(', ')}`);
  if (siteAAAA.length === 0) warn(`${SITE} resolves to no IPv6 address`);
  else ok(`${SITE} IPv6: ${siteAAAA.join(', ')}`);

  const apexA = await lookup(resolver.resolve4(APEX));
  const apexAAAA = await lookup(resolver.resolve6(APEX));
  const missingA = APEX_A.filter((address) => !apexA.includes(address));
  if (missingA.length > 0) fail(`${APEX} is missing GitHub's A records: ${missingA.join(', ')}`);
  else ok(`${APEX} carries GitHub's four A records`);

  const missingAAAA = APEX_AAAA.filter((address) => !apexAAAA.includes(address));
  if (missingAAAA.length === APEX_AAAA.length) {
    warn(
      `${APEX} has no AAAA records, so a network with IPv6 and no working IPv4 cannot reach it at all. GitHub publishes four: ${APEX_AAAA.join(', ')}. Note that ${SITE} does have them, through the CNAME — the two names are not equally reachable, which is the kind of difference that makes an outage look intermittent.`,
    );
  } else if (missingAAAA.length > 0) {
    warn(`${APEX} is missing some of GitHub's AAAA records: ${missingAAAA.join(', ')}`);
  } else {
    ok(`${APEX} carries GitHub's four AAAA records`);
  }

  const challenge = await lookup(resolver.resolveTxt(CHALLENGE));
  if (challenge.length > 0) ok(`${APEX} is verified with GitHub (${CHALLENGE} exists)`);
  else
    warn(
      `${CHALLENGE} does not exist, so the domain is not verified with GitHub. An unverified domain can be claimed by another account if it is ever unset here, and GitHub is readier to drop it.`,
    );

  return { siteA, siteAAAA, apexA, apexAAAA };
}

async function checkPage(address) {
  const label = `${SITE} at ${address}`;
  let answer;
  try {
    answer = await fetchOverAddress({ address, host: SITE });
  } catch (err) {
    fail(`${label}: ${describeError(err)}`);
    return;
  }

  checkCertificate(label, answer.cert);

  if (answer.status !== 200) {
    fail(`${label}: HTTP ${answer.status}`);
    return;
  }
  if (!answer.body.includes('id="root"')) {
    fail(`${label}: answered 200 but the page has no app root in it`);
    return;
  }
  ok(`${label}: HTTP 200, ${answer.body.length} bytes of index.html`);

  const assets = assetsOf(answer.body);
  if (assets.length === 0) {
    fail(`${label}: index.html asks for no script at all`);
    return;
  }

  for (const asset of assets) {
    if (!asset.startsWith('/')) {
      fail(
        `${label}: index.html asks for ${asset}, which is not rooted. The site is served from the root of the domain, so BASE_PATH in the deploy job is wrong.`,
      );
      continue;
    }
    let file;
    try {
      file = await fetchOverAddress({ address, host: SITE, path: asset });
    } catch (err) {
      fail(`${label}: ${asset} — ${describeError(err)}`);
      continue;
    }
    const type = file.headers['content-type'] ?? '';
    if (file.status !== 200) {
      fail(`${label}: ${asset} answered HTTP ${file.status}`);
    } else if (!type.includes(expectedType(asset))) {
      fail(
        `${label}: ${asset} answered 200 with content type "${type}". That is 404.html standing in for a file that is not there — the app is a white screen. Check BASE_PATH in the deploy job.`,
      );
    } else {
      ok(`${label}: ${asset} — HTTP 200, ${type}`);
    }
  }
}

async function checkHttpRedirect(address) {
  const label = `http://${SITE} at ${address}`;
  let answer;
  try {
    answer = await fetchOverAddress({ address, host: SITE, protocol: 'http' });
  } catch (err) {
    fail(`${label}: ${describeError(err)}`);
    return;
  }
  const location = answer.headers.location ?? '';
  if (answer.status >= 300 && answer.status < 400 && location.startsWith('https://')) {
    ok(`${label}: ${answer.status} to ${location}`);
  } else {
    warn(
      `${label}: HTTP ${answer.status}${location ? ` to ${location}` : ''} rather than a redirect to https. "Enforce HTTPS" is off in the Pages settings, or the certificate is not ready.`,
    );
  }
}

async function checkApex(address) {
  const label = `${APEX} at ${address}`;
  let answer;
  try {
    answer = await fetchOverAddress({ address, host: APEX });
  } catch (err) {
    fail(`${label}: ${describeError(err)}`);
    return;
  }
  checkCertificate(label, answer.cert);
  const location = answer.headers.location ?? '';
  if (answer.status >= 300 && answer.status < 400 && location.includes(SITE)) {
    ok(`${label}: ${answer.status} to ${location}`);
  } else if (answer.status === 200) {
    ok(`${label}: HTTP 200 — it serves the site itself rather than redirecting`);
  } else {
    fail(`${label}: HTTP ${answer.status}${location ? ` to ${location}` : ''}`);
  }
}

const dnsOnly = process.argv.includes('--dns-only');

console.log(`Beschikbaarheid — ${new Date().toISOString()}\n`);

const { siteA, siteAAAA, apexA, apexAAAA } = await checkDns();

if (!dnsOnly) {
  for (const address of [...siteA, ...siteAAAA]) await checkPage(address);
  for (const address of [...apexA, ...apexAAAA]) await checkApex(address);
  // One address is enough for the redirect: it is a setting, not an edge.
  if (siteA.length > 0) await checkHttpRedirect(siteA[0]);
}

console.log(lines.join('\n'));
console.log(
  `\n${failures} failed, ${warnings} to look at, ${lines.length - failures - warnings} fine.`,
);

if (failures > 0) {
  console.log('\nThe site did not answer the way it should. The lines marked FAIL say how.');
  process.exit(1);
}
