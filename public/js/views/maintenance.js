function authState(auth) {
  if (auth.state === 'success') {
    location.reload();
  }
}

$(function () {
  $('.ui.modal').modal('setting', 'closable', false).modal('show');

  function setDarkTheme(on) {
    localStorage.setItem('darkTheme', JSON.stringify(on));
    $('.dark-theme-css').prop('disabled', !on);
  }

  let darkTheme = JSON.parse(localStorage.getItem('darkTheme'));
  setDarkTheme(darkTheme);

  $('.login').on('click', function () {
    window.open('/auth/twitch', '_blank');
  });
});