// _csrf = {{csrfToken}}
// notifications = {{notifications}}

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
  let converter = new showdown.Converter({
    simpleLineBreaks: true
  });

  for (let i = 0; i < notifications.length; i++) {
    let noti = notifications[i];

    let template;
    switch (noti.data.type) {
      case 'information': {
        template = $('#notification-template').html();
        break;
      }
      case 'race-nomination': {
        template = $('#notification-race-template').html();
        break;
      }
    }

    template = template.replace('##uuid##', noti.uuid);
    template = template.replace('##subject##', noti.data.subject);
    template = template.replace('##timestamp##', moment(noti.timestamp).fromNow());
    template = template.replace('##content##', converter.makeHtml(noti.data.content));

    if (noti.read) {
      template = template.replace('##label-color##', 'green');
      template = template.replace('##label-text##', 'Read');
    } else {
      template = template.replace('##label-color##', 'red');
      template = template.replace('##label-text##', 'Unread');
    }

    $('.notifications').append(template);
    let $notification = $('.notification[uuid="' + noti.uuid + '"]');

    if (!noti.read) {
      $notification.addClass('unread');
    }

    if (noti.data.type === 'race-nomination') {
      $notification.attr('submission-uuid', noti.data.submission_uuid);

      if (noti.data.executed) {
        $notification.find('.accept-nomination, .decline-nomination').remove();
      } else {
        $notification.find('.remove-notification').remove();
      }
    }
  }

  $(document).on('click', '.notification.unread', function () {
    postTo('/api/user/notifications/' + $(this).attr('uuid') + '/read', null, () => {
      $(this).removeClass('unread');
      let $label = $(this).find('.read-indicator');
      $label.removeClass('red').addClass('green').text('Read');
    });
  });

  $(document).on('click', '.remove-notification', function () {
    postTo('/api/user/notifications/' + $(this).parents('.notification').attr('uuid') + '/remove', null, () => location.reload());
  });

  $(document).on('click', '.accept-nomination', function () {
    let $notification = $(this).parents('.notification');
    postTo('/api/user/submissions/' + $notification.attr('submission-uuid') + '/decide-race', { accepted: true }, () => {
      postTo('/api/user/notifications/' + $notification.attr('uuid') + '/execute', null, () => location.reload());
    });
  });

  $(document).on('click', '.decline-nomination', function () {
    let $notification = $(this).parents('.notification');
    postTo('/api/user/submissions/' + $notification.attr('submission-uuid') + '/decide-race', { accepted: false }, () => {
      postTo('/api/user/notifications/' + $notification.attr('uuid') + '/execute', null, () => location.reload());
    });
  });

  $('.notifications').accordion();
});
