export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 基础健康检查
    if (url.pathname === '/') {
      return new Response('Test Worker is running!\n');
    }
    
    // 测试 fetch 出站
    if (url.pathname === '/test-fetch') {
      try {
        const resp = await fetch('https://1.1.1.1/cdn-cgi/trace');
        const text = await resp.text();
        return new Response('FETCH OK\\n' + text);
      } catch(e) {
        return new Response('FETCH ERROR: ' + e.message + '\\n' + e.stack);
      }
    }
    
    // 测试 TCP connect
    if (url.pathname === '/test-connect') {
      try {
        const connect = request.fetcher.connect;
        if (!connect) return new Response('connect() API not available\\n');
        const socket = connect({ hostname: '1.1.1.1', port: 443 });
        const writer = socket.writable.getWriter();
        await writer.write(new TextEncoder().encode(
          'GET /cdn-cgi/trace HTTP/1.1\\r\\nHost: 1.1.1.1\\r\\nConnection: close\\r\\n\\r\\n'
        ));
        writer.releaseLock();
        const reader = socket.readable.getReader();
        let response = '';
        while(true) {
          const {done, value} = await reader.read();
          if (done) break;
          response += new TextDecoder().decode(value);
        }
        return new Response('CONNECT OK\\n' + response.split('\\r\\n').slice(0, 10).join('\\n'));
      } catch(e) {
        return new Response('CONNECT ERROR: ' + e.message + '\\n' + e.stack);
      }
    }
    
    return new Response('Try /test-fetch or /test-connect\\n');
  }
}
