/* jshint mocha:true */
'use strict';

var assert = require('assert');

var getProxyForUrl = require('./').getProxyForUrl;

describe('getProxyForUrl', function() {
  beforeEach(function() {
    // Remove all proxy-related environment variables.
    Object.keys(process.env).forEach(function(key) {
      if (/proxy/i.test(key)) {
        delete process.env[key];
      }
    });
  });

  it('No proxy variables', function() {
    assert.strictEqual('', getProxyForUrl('http://example.com'));
    assert.strictEqual('', getProxyForUrl('https://example.com'));
    assert.strictEqual('', getProxyForUrl('ftp://example.com'));
  });

  it('Invalid URLs', function() {
    process.env.ALL_PROXY = 'http://unexpected.proxy';
    assert.strictEqual('', getProxyForUrl('bogus'));
    assert.strictEqual('', getProxyForUrl('//example.com'));
    assert.strictEqual('', getProxyForUrl('/path'));
    assert.strictEqual('', getProxyForUrl(''));

    assert.throws(function() {
      getProxyForUrl();
    }, TypeError);  // "Parameter 'url' must be a string, not undefined"

    assert.throws(function() {
      getProxyForUrl({});
    }, TypeError);  // "Parameter 'url' must be a string, not object"
  });

  it('http_proxy and HTTP_PROXY', function() {
    process.env.HTTP_PROXY = 'http://http-proxy';

    assert.strictEqual('', getProxyForUrl('https://example'));
    assert.strictEqual('http://http-proxy', getProxyForUrl('http://example'));
    
    process.env.http_proxy = 'http://priority';
    assert.strictEqual('http://priority', getProxyForUrl('http://example'));
  });

  it('http_proxy with non-sensical value', function() {
    // Crazy values should be passed as-is. It is the responsibility of the
    // one who launches the application that the value makes sense.
    // TODO: Should we be stricter and perform validation?
    process.env.http_proxy = 'Crazy \n!() { :: }';
    assert.strictEqual('Crazy \n!() { :: }', getProxyForUrl('http://wow'));
  });

  it('https_proxy and HTTPS_PROXY', function() {
    // Assert that there is no fall back to http_proxy
    process.env.HTTP_PROXY = 'http://unexpected.proxy';
    assert.strictEqual('', getProxyForUrl('https://example'));

    process.env.HTTPS_PROXY = 'http://https-proxy';
    assert.strictEqual('http://https-proxy', getProxyForUrl('https://example'));

    process.env.https_proxy = 'http://priority';
    assert.strictEqual('http://priority', getProxyForUrl('https://example'));
  });

  it('ftp_proxy', function() {
    // Something else than http_proxy / https, as a sanity check.
    process.env.ftp_proxy = 'http://ftp-proxy';

    assert.strictEqual('http://ftp-proxy', getProxyForUrl('ftp://example'));
    assert.strictEqual('', getProxyForUrl('ftps://example'));
  });

  it('all_proxy', function() {
    process.env.ALL_PROXY = 'http://catch-all';
    assert.strictEqual('http://catch-all', getProxyForUrl('https://example'));

    process.env.all_proxy = 'http://priority';
    assert.strictEqual('http://priority', getProxyForUrl('https://example'));
  });

  it('no_proxy empty', function() {
    process.env.ALL_PROXY = 'http://proxy';

    // NO_PROXY set but empty.
    process.env.NO_PROXY = '';
    assert.strictEqual('http://proxy', getProxyForUrl('https://example'));

    // No entries in NO_PROXY (comma).
    process.env.NO_PROXY = ',';
    assert.strictEqual('http://proxy', getProxyForUrl('https://example'));

    // No entries in NO_PROXY (whitespace).
    process.env.NO_PROXY = ' ';
    assert.strictEqual('http://proxy', getProxyForUrl('https://example'));

    // No entries in NO_PROXY (multiple whitespace / commas).
    process.env.NO_PROXY = ',\t,,,\n,  ,\r';
    assert.strictEqual('http://proxy', getProxyForUrl('https://example'));
  });
  
  it('no_proxy=example (single host)', function() {
    process.env.ALL_PROXY = 'http://proxy';

    process.env.NO_PROXY = 'example';
    assert.strictEqual('', getProxyForUrl('http://example'));
    assert.strictEqual('', getProxyForUrl('http://example:80'));
    assert.strictEqual('', getProxyForUrl('http://example:0'));
    assert.strictEqual('', getProxyForUrl('http://example:1337'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://sub.example'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://prefexample'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://example.no'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://a.b.example'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://host/example'));
  });
  
  it('no_proxy=sub.example (subdomain)', function() {
    process.env.ALL_PROXY = 'http://proxy';

    process.env.NO_PROXY = 'sub.example';
    assert.strictEqual('http://proxy', getProxyForUrl('http://example'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://example:80'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://example:0'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://example:1337'));
    assert.strictEqual('', getProxyForUrl('http://sub.example'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://no.sub.example'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://sub-example'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://example.sub'));
  });
  
  it('no_proxy=example:80 (host + port)', function() {
    process.env.ALL_PROXY = 'http://proxy';

    process.env.NO_PROXY = 'example:80';
    assert.strictEqual('', getProxyForUrl('http://example'));
    assert.strictEqual('', getProxyForUrl('http://example:80'));
    assert.strictEqual('', getProxyForUrl('http://example:0'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://example:1337'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://sub.example'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://prefexample'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://example.no'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://a.b.example'));
  });
  
  it('no_proxy=.example (host suffix)', function() {
    process.env.ALL_PROXY = 'http://proxy';

    process.env.NO_PROXY = '.example';
    assert.strictEqual('http://proxy', getProxyForUrl('http://example'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://example:80'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://example:1337'));
    assert.strictEqual('', getProxyForUrl('http://sub.example'));
    assert.strictEqual('', getProxyForUrl('http://sub.example:80'));
    assert.strictEqual('', getProxyForUrl('http://sub.example:1337'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://prefexample'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://example.no'));
    assert.strictEqual('', getProxyForUrl('http://a.b.example'));
  });
  
  it('no_proxy=*.example (host suffix with *.)', function() {
    process.env.ALL_PROXY = 'http://proxy';

    process.env.NO_PROXY = '*.example';
    assert.strictEqual('http://proxy', getProxyForUrl('http://example'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://example:80'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://example:1337'));
    assert.strictEqual('', getProxyForUrl('http://sub.example'));
    assert.strictEqual('', getProxyForUrl('http://sub.example:80'));
    assert.strictEqual('', getProxyForUrl('http://sub.example:1337'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://prefexample'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://example.no'));
    assert.strictEqual('', getProxyForUrl('http://a.b.example'));
  });
  
  it('no_proxy=*example (substring suffix)', function() {
    process.env.ALL_PROXY = 'http://proxy';

    process.env.NO_PROXY = '*example';
    assert.strictEqual('', getProxyForUrl('http://example'));
    assert.strictEqual('', getProxyForUrl('http://example:80'));
    assert.strictEqual('', getProxyForUrl('http://example:1337'));
    assert.strictEqual('', getProxyForUrl('http://sub.example'));
    assert.strictEqual('', getProxyForUrl('http://sub.example:80'));
    assert.strictEqual('', getProxyForUrl('http://sub.example:1337'));
    assert.strictEqual('', getProxyForUrl('http://prefexample'));
    assert.strictEqual('', getProxyForUrl('http://a.b.example'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://example.no'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://host/example'));
  });
  
  it('no_proxy=.*example (arbitrary wildcards are NOT supported)', function() {
    process.env.ALL_PROXY = 'http://proxy';

    process.env.NO_PROXY = '.*example';
    assert.strictEqual('http://proxy', getProxyForUrl('http://example'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://sub.example'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://sub.example'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://prefexample'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://x.prefexample'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://a.b.example'));
  });
  
  it('no_proxy=[::1],[::2]:80,10.0.0.1,10.0.0.2:80 (IP addresses)', function() {
    process.env.ALL_PROXY = 'http://proxy';

    process.env.NO_PROXY = '[::1],[::2]:80,10.0.0.1,10.0.0.2:80';
    assert.strictEqual('', getProxyForUrl('http://[::1]/'));
    assert.strictEqual('', getProxyForUrl('http://[::1]:80/'));
    assert.strictEqual('', getProxyForUrl('http://[::1]:1337/'));

    assert.strictEqual('', getProxyForUrl('http://[::2]/'));
    assert.strictEqual('', getProxyForUrl('http://[::2]:80/'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://[::2]:1337/'));

    assert.strictEqual('', getProxyForUrl('http://10.0.0.1/'));
    assert.strictEqual('', getProxyForUrl('http://10.0.0.1:80/'));
    assert.strictEqual('', getProxyForUrl('http://10.0.0.1:1337/'));

    assert.strictEqual('', getProxyForUrl('http://10.0.0.2/'));
    assert.strictEqual('', getProxyForUrl('http://10.0.0.2:80/'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://10.0.0.2:1337/'));
  });

  it('no_proxy=127.0.0.1/32 (CIDR is NOT supported)', function() {
    process.env.ALL_PROXY = 'http://proxy';

    process.env.NO_PROXY = '127.0.0.1/32';
    assert.strictEqual('http://proxy', getProxyForUrl('http://127.0.0.1'));
    assert.strictEqual('http://proxy', getProxyForUrl('http://127.0.0.1/32'));
  });

  it('no_proxy=127.0.0.1 does NOT match localhost', function() {
    process.env.ALL_PROXY = 'http://proxy';

    process.env.NO_PROXY = '127.0.0.1';
    assert.strictEqual('', getProxyForUrl('http://127.0.0.1'));
    // We're not performing DNS queries, so this shouldn't match.
    assert.strictEqual('http://proxy', getProxyForUrl('http://localhost'));
  });
  
  it('no_proxy with protocols that have a default port', function() {
    process.env.WS_PROXY = 'http://ws';
    process.env.WSS_PROXY = 'http://wss';
    process.env.HTTP_PROXY = 'http://http';
    process.env.HTTPS_PROXY = 'http://https';
    process.env.GOPHER_PROXY = 'http://gopher';
    process.env.FTP_PROXY = 'http://ftp';
    process.env.ALL_PROXY = 'http://all';

    process.env.NO_PROXY = 'xxx:21,xxx:70,xxx:80,xxx:443';

    assert.strictEqual('', getProxyForUrl('http://xxx'));
    assert.strictEqual('', getProxyForUrl('http://xxx:80'));
    assert.strictEqual('http://http', getProxyForUrl('http://xxx:1337'));

    assert.strictEqual('', getProxyForUrl('ws://xxx'));
    assert.strictEqual('', getProxyForUrl('ws://xxx:80'));
    assert.strictEqual('http://ws', getProxyForUrl('ws://xxx:1337'));

    assert.strictEqual('', getProxyForUrl('https://xxx'));
    assert.strictEqual('', getProxyForUrl('https://xxx:443'));
    assert.strictEqual('http://https', getProxyForUrl('https://xxx:1337'));

    assert.strictEqual('', getProxyForUrl('wss://xxx'));
    assert.strictEqual('', getProxyForUrl('wss://xxx:443'));
    assert.strictEqual('http://wss', getProxyForUrl('wss://xxx:1337'));

    assert.strictEqual('', getProxyForUrl('gopher://xxx'));
    assert.strictEqual('', getProxyForUrl('gopher://xxx:70'));
    assert.strictEqual('http://gopher', getProxyForUrl('gopher://xxx:1337'));

    assert.strictEqual('', getProxyForUrl('ftp://xxx'));
    assert.strictEqual('', getProxyForUrl('ftp://xxx:21'));
    assert.strictEqual('http://ftp', getProxyForUrl('ftp://xxx:1337'));
  });
});
