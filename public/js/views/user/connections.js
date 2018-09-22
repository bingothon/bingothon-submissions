// _csrf = {{csrfToken}}
// connections = {{JSONstringify profile.connections}}

function authState(auth, user) {
  location.reload();
}

function postTo(url, data, successCallback) {
  data = data || {};
  data._csrf = _csrf;

  $.ajax({
    type: 'POST',
    url: url,
    data: JSON.stringify(data),
    success: successCallback,
    contentType: 'application/json',
    dataType: 'text'
  });
}

$(function () {
  $('.link-button').each(function (index, elem) {
    $.getJSON(window.location.origin + '/api/admin/settings/get-connection-status?type=' + $(this).attr('d-type'), (data, status) => {
      if (data.err) throw data.err;

      if (data.isSetup) $(elem).css('display', 'inline-block'); //normal .show() doesn't cut it (that one uses display: block)
    });
  });

  $('.link-button').on('click', function () {
    let dType = $(this).attr('d-type');
    $(this).addClass('disabled loading');
    window.open(`/auth/${dType}/callback`, '_blank');
  });

  $('.unlink-button').on('click', function () {
    let dType = $(this).attr('d-type');
    $(this).addClass('disabled loading');
    window.open(`/auth/${dType}/unlink`, '_blank');
  });

  $('.save-speedrun-com-username').on('click', function () {
    postTo('/api/user/setSpeedrunComUser', { username: $('.speedrun-com-username-input').val() }, () => {
      $('.update-speedrun-username-modal').modal('setting', 'closable', false).modal('show');
      setTimeout(() => location.reload(), 3000);
    });
  });

  let services = ['discord', 'twitter', 'youtube'];
  for (serviceName in connections) {
    if (!$.isEmptyObject(connections[serviceName])) services.splice(services.indexOf(serviceName), 1);
  }
  services.forEach(elem => {
    elem = (elem === 'discord') ? 'icon-discord' : elem;
    $('.huge.icon.' + elem).removeClass('blue red purple').addClass('grey');
  });
});
