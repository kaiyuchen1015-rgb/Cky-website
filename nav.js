fetch('nav.html')
  .then(response => response.text())
  .then(html => {
    document.getElementById('site-header').innerHTML = html;
  });