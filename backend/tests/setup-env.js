// Must run before any backend module is imported: config selection happens at
// require time via NODE_ENV.
process.env.NODE_ENV = 'test';
