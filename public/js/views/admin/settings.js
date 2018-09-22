// _csrf = {{csrfToken}}
// eventData = {{eventData}}
// adminData = {{adminData}}
// admins = {{admins}}
// users = {{users}}
// profileId = {{profile.id}}

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
  $('.event-name').text(eventData.name);

  let event_from = moment.tz(eventData.event_from, eventData.timezone);
  let event_to = moment.tz(eventData.event_to, eventData.timezone);

  $('.event-from').text(event_from.format('MMMM Do YYYY, hh:mm:ss A (UTC Z)'));
  $('.event-to').text(event_to.format('MMMM Do YYYY, hh:mm:ss A (UTC Z)'));

  $('.event-tz').text(eventData.timezone + event_from.format(' (z / UTC Z)'));

  $('.public-webhook').text(adminData.webhooks.public);
  $('.audit-webhook').text(adminData.webhooks.audit);

  $('input[name="submission-limit"]').val(eventData.submissionLimit);

  let permissions = ['None', 'Scheduler', 'Admin', 'Owner'];
  let permissionsColors = ['none', 'orange', 'blue', 'red'];

  let adminList = [], adminIDs = {};
  for (let i = 0; i < admins.length; i++) {
    let a = admins[i];

    adminList.push({
      name: a.displayName + ' <div class="ui horizontal tiny ' + permissionsColors[a.permissions] + ' label">' + permissions[a.permissions] + '</div>',
      value: a.id
    });

    adminIDs[a.id] = a.permissions;
  }

  let userList = [];
  for (let i = 0; i < users.length; i++) {
    let u = users[i];

    if (adminIDs[u.id]) {
      continue;
    }

    userList.push({
      name: u.displayName,
      value: u.id
    });
  }

  let selectedUser = -1;
  let selectedUserAdd = -1;
  let selectedRole = -1;

  $('.admins').dropdown({
    values: adminList,
    onChange: function (val, text) {
      selectedUser = Number(val);

      if (adminIDs[selectedUser] < 3) {
        $('.edit-user').removeClass('disabled');
        $('.remove-user').removeClass('disabled');
      } else {
        $('.edit-user').addClass('disabled');
        $('.remove-user').addClass('disabled');
      }
    }
  });

  let submissionValues = [
    {
      name: '<div class="ui horizontal large orange label">Not Open</div>',
      value: 1
    },
    {
      name: '<div class="ui horizontal large green label">Open</div><div class="ui horizontal large blue label">Editable</div>',
      value: 2
    },
    {
      name: '<div class="ui horizontal large red label">Closed</div><div class="ui horizontal large blue label">Editable</div>',
      value: 3
    },
    {
      name: '<div class="ui horizontal large red label">Closed</div><div class="ui horizontal large red label">Not Editable</div>',
      value: 4
    },
  ];
  let selectedSubmissionPhase = -1;
  $('.submission-phase').dropdown({
    values: submissionValues,
    onChange: function (val, text) {
      selectedSubmissionPhase = Number(val);
      if (selectedSubmissionPhase !== 0) {
        selectedSubmissionPhase -= 1;
        $('.update-submission-settings').removeClass('disabled');
      }
    }
  }).dropdown('set selected', eventData.submissionState + 1);

  $('.users').dropdown({
    values: userList,
    onChange: function (val, text) {
      selectedUserAdd = Number(val);
    }
  });

  $('.roles').dropdown({
    values: [
      {
        name: 'Admin',
        value: 2
      }
    ],
    onChange: function (val, text) {
      selectedRole = Number(val);
    }
  });

  $('.update-submission-settings').on('click', function () {
    $('.update-submission-settings-modal').modal({
      closable: false,
      onApprove: function () {
        let submissionLimit = $('input[name="submission-limit"]').val();
        if (selectedSubmissionPhase === '' || submissionLimit === '') {
          $('.update-submission-settings-modal').transition('shake');
          return false;
        } else {
          // TODO: API endpoint after refactor
          postTo('/api/admin/settings/update/submissions', { submissionState: selectedSubmissionPhase, submissionLimit: Number(submissionLimit) }, function () {
            location.reload();
          });
        }
      }
    }).modal('show');
  });

  $('.add-user').on('click', function () {
    $('.add-user-modal').modal({
      closable: false,
      onApprove: function () {
        if (selectedUserAdd === '' || selectedRole === '') {
          $('.add-user-modal').transition('shake');
          return false;
        } else {
          postTo('/api/admin/user/add', { id: selectedUserAdd, permissions: selectedRole }, function () {
            location.reload();
          });
        }
      }
    }).modal('show');
  });

  $('.edit-user').on('click', function () {
    if (selectedUser !== '') {
      $('.edit-user-modal').modal({
        closable: false,
        onApprove: function () {
          postTo('/api/admin/user/edit', { id: selectedUser, permissions: selectedRole }, function () {
            location.reload();
          });
        }
      }).modal('show');
    }
  });

  $('.remove-user').on('click', function () {
    if (selectedUser !== '') {
      $('.remove-user-modal').modal({
        closable: false,
        onApprove: function () {
          postTo('/api/admin/user/remove', { id: selectedUser }, function () {
            location.reload();
          });
        }
      }).modal('show');
    }
  });

  $('.edit-stages-modal .ui.checkbox.checked').checkbox('set checked');

  $('.edit-stages').on('click', function () {
    $('.edit-stages-modal').modal({
      closable: false,
      onApprove: function () {
        let data = {};

        for (let i = 0; i <= 3; i++) {
          let innerData = {};
          let $inputs = $(`.edit-stages-modal [data-tab='stage-${i}'] .ui.checkbox input`);
          for (let k = 0; k < $inputs.length; k++) {
            console.log($($inputs[k]).val());
            innerData[$($inputs[k]).attr('name')] = $($inputs[k]).is(':checked');
          }
          data[i] = innerData;
        }

        postTo('/api/admin/settings/update/editable', data, () => location.reload());
      },
      onDeny: function () {
        $('.edit-stages-modal .ui.checkbox.checked').checkbox('set checked');
        $('.edit-stages-modal .ui.checkbox').not('.checked').checkbox('set unchecked');
        return true;
      }
    }).modal('show');
  });

  $('.edit-stages-modal-menu .item').tab({ history: false });

  $('.reset-settings').on('click', function () {
    $('.reset-settings-modal').modal({
      closable: false,
      onApprove: function () {
        postTo('/api/admin/settings/reset', null, function () {
          window.location = '/';
        });
      }
    }).modal('show');
  });

  function showEditSettingsModal() {
    $('.edit-settings-modal').modal({
      closable: false,
      onApprove: function () {
        let $modal = $('.edit-settings-modal');
        let $previewModal = $('.edit-settings-preview-modal');

        let name = $modal.find('input[name="event-name"]').val();
        let publicWebhook = $modal.find('input[name="public-webhook"]').val();
        let auditWebhook = $modal.find('input[name="audit-webhook"]').val();

        $previewModal.find('.event-name').text(name);
        $previewModal.find('.public-webhook').text(publicWebhook);
        $previewModal.find('.audit-webhook').text(auditWebhook);

        showEditSettingsPreviewModal({
          name: name,
          publicWebhook: publicWebhook,
          auditWebhook: auditWebhook
        });
      }
    }).modal('show');
  }

  $('.edit-settings').on('click', function () {
    let $modal = $('.edit-settings-modal');

    $modal.find('input[name="event-name"]').val(eventData.name);
    $modal.find('input[name="public-webhook"]').val(adminData.webhooks.public);
    $modal.find('input[name="audit-webhook"]').val(adminData.webhooks.audit);

    showEditSettingsModal();
  });

  function showEditSettingsPreviewModal(data) {
    $('.edit-settings-preview-modal').modal({
      closable: false,
      onApprove: function () {
        postTo('/api/admin/settings/update/event-data', { data }, function () {
          location.reload();
        });
      },
      onDeny: showEditSettingsModal
    }).modal('show');
  }

  $('.event-info-textarea').val(eventData.info);
  console.log(eventData.info);

  let md = new Remarkable({
    html: true
  });
  function showUpdateEventInfoModal() {
    $('.update-event-info-modal').modal({
      closable: false,
      onApprove: function () {
        $('.update-event-info-preview-modal .content .ui.segment').html(md.render($('.event-info-textarea').val()));
        showUpdateEventInfoPreviewModal();
      }
    }).modal('show');
  }

  function showUpdateEventInfoPreviewModal() {
    $('.update-event-info-preview-modal').modal({
      closable: false,
      onApprove: function () {
        postTo('/api/admin/settings/update/event-info', { info: $('.event-info-textarea').val() }, function () {
          location.reload();
        });
      },
      onDeny: showUpdateEventInfoModal
    }).modal('show');
  }

  $('.update-event-info').on('click', function () {
    showUpdateEventInfoModal();
  });

  // Hehehe...
  let secretAudio = new Howl({
    src: '/audio/secret.mp3',
    autoplay: false,
    loop: false,
    volume: 0.2
  });

  cheet('↑ ↑ ↓ ↓ ← → ← → b a', function () {
    secretAudio.play();

    $('.roles').dropdown('change values', [
      {
        name: 'Admin',
        value: 2
      },
      {
        name: 'Owner',
        value: 3
      }
    ]);
  });
});
