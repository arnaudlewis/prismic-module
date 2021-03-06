const fs = require('fs')
const logger = require('@/logger');
logger.mockTypes(() => jest.fn());
const prismicNuxt = require("../src");

describe("prismic-nuxt module", function() {
  let context;
  let moduleOptions;

  beforeAll(() => consola.wrapAll())
  beforeEach(function() {
    context = {
      _routes: [],
      _resolve: jest.fn(),
      addPlugin: jest.fn(),
      addTemplate: jest.fn(),
      extendRoutes: jest.fn((fn) => {
        fn(context._routes, context._resolve)
      }),
      options: {
        srcDir: '/var/nuxt',
        buildDir: '/var/nuxt/.nuxt/',
        head: {},
        dir: {}
      }
    }

    moduleOptions = {
      endpoint: "https://test.cdn.prismic.io/api/v2"
    };
  });

  it("should be defined", function() {
    expect(prismicNuxt).toBeDefined();
  });

  it("should add the components", function() {
    prismicNuxt.call(context, moduleOptions);
    expect(context.addPlugin.mock.calls).toHaveLength(3)
  });

  it("should not add the components if components=false", function() {
    prismicNuxt.call(context, { ...moduleOptions, components: false });
    expect(context.addPlugin.mock.calls).toHaveLength(2)
  });

  it("should set preview to /preview if true", function() {
    prismicNuxt.call(context, { ...moduleOptions, preview: true });
    expect(context.addPlugin.mock.calls.length).toEqual(3)
    expect(context.addPlugin.mock.calls[0][0].fileName).toEqual('prismic/middleware/prismic_preview.js')
    expect(context.addPlugin.mock.calls[2][0].options.preview).toEqual('/preview')
    expect(context.options.router.middleware).toEqual(['prismic_preview'])
  });

  it("should set preview to /test_preview", function() {
    prismicNuxt.call(context, { ...moduleOptions, preview: '/test_preview' });
    expect(context.addPlugin.mock.calls[0][0].fileName).toEqual('prismic/middleware/prismic_preview.js')
    expect(context.addPlugin.mock.calls[2][0].options.preview).toEqual('/test_preview')
    expect(context._routes[0].path).toEqual('/test_preview')
    expect(context._resolve.mock.calls[0]).toEqual(['/var/nuxt/.nuxt/', 'prismic/pages/preview.vue'])
  });

  it("should remove preview if false", function() {
    prismicNuxt.call(context, { ...moduleOptions, preview: false });
    expect(context.addPlugin.mock.calls.length).toEqual(2)
  });

  it("should parse repo from endpoint", function() {
    prismicNuxt.call(context, { endpoint: 'https://test2.prismic.io/api/v2' });
    expect(context.addPlugin.mock.calls[2][0].options.repo).toEqual('test2')
  });

  it("should warn to create ~/app/prismic/link-resolver.js", async function() {
    await prismicNuxt.call(context, { ...moduleOptions });
    expect(logger.warn).toHaveBeenNthCalledWith(1, 'Please create ~/app/prismic/link-resolver.js')
  });

  it("should not warn to create ~/app/prismic/link-resolver.js if option given", async function() {
    await prismicNuxt.call(context, { ...moduleOptions, linkResolver: () => '/' });
    expect(logger.warn.mock.calls.length).toEqual(0)
  });

  it("should not warn to create ~/app/prismic/link-resolver.js if path exists", async function() {
    fs.existsSync = jest.fn().mockReturnValueOnce(true)
    await prismicNuxt.call(context, { ...moduleOptions });
    expect(logger.warn.mock.calls.length).toEqual(0)
    expect(context.addTemplate.mock.calls[1][0].src).toEqual('/var/nuxt/app/prismic/link-resolver.js')
  });

  it("should not create ~/app/prismic/html-serializer.js if path exists", async function() {
    fs.existsSync = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(true)
    await prismicNuxt.call(context, { ...moduleOptions });
    expect(logger.warn.mock.calls.length).toEqual(0)
    expect(context.addTemplate.mock.calls[2][0].src).toEqual('/var/nuxt/app/prismic/html-serializer.js')
  });

});
