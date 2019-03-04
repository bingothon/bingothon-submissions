// eventData = {{eventData}}
// _csrf = {{csrfToken}}
// profileId = {{profile.id}}
// srComUsername = {{profile.speedrunComUser}}
// discordUsername = {{profile.connections.discord.username}}

$(function () {
  let selectedGame;
  $('.game-search').search({
    error: {
      noResults: 'No game with that name found. You can still submit it though!'
    },
    apiSettings: {
      cache: false,
      url: '//www.speedrun.com/api/v1/games?embed=platforms,regions&name={query}&callback=?',
      onResponse: function (srResponse) {
        let response = {
          results: []
        };

        for (let i = 0; i < srResponse.data.length; i++) {
          let item = srResponse.data[i];

          let res = {
            id: item.id,
            title: item.names.international,
            twitch_name: item.names.twitch,
            platforms: item.platforms,
            regions: item.regions,
            link: item.weblink
          };

          if (item.names.japanese) {
            res.description = 'Japanese: ' + item.names.japanese;
          }

          response.results.push(res);
        }
        return response;
      }
    },
    minCharacters: 3,
    saveRemoteData: false,
    onSelect: function (result) {
      selectedGame = result;
      $('input[name="leaderboards"]').val(selectedGame.link);
      $('input[name="twitch-name"]').val(selectedGame.twitch_name || '');
    }
  });

  $('.popup').popup({
    position: 'bottom left'
  });

  let selectedRunners = [];
  $('.race-dropdown').dropdown({
    apiSettings: {
      cache: false,
      url: '/api/user/search/{query}',
      onResponse: function (users) {
        let response = {
          results: []
        };

        for (let i in users) {
          let user = users[i];

          if (user.id === profileId) continue;

          let res = {
            name: user.displayName + ' (' + user.speedrunComUser + ')',
            value: user.id
          };

          response.results.push(res);
        }
        return response;
      }
    },
    minCharacters: 3,
    saveRemoteData: false,
    maxSelections: 3,
    onAdd: function (addedValue) {
      if (!selectedRunners.includes(addedValue)) selectedRunners.push(addedValue);
    },
    onRemove: function (removedValue) {
      if (selectedRunners.includes(removedValue)) selectedRunners.splice(selectedRunners.indexOf(removedValue), 1);
    }
  });

  let submissionState = eventData.submissionState;
  if (submissionState === 1) {
    $('.form-container').removeClass('to-show');

    let isRace = false;
    $('.race-checkbox').checkbox({
      onChecked: () => {
        $('.race-info').show();
        $('.runner-list .runner').addClass('required');
        isRace = true;
      },
      onUnchecked: () => {
        $('.race-info').hide();
        $('.runner-list .runner').removeClass('required');
        isRace = false;
      }
    });

    $('textarea').on('input', function () {
      let text_length = $(this).val().length;

      $(this).parent().children('.chars-used').text(text_length + '/750');
    });

    function formError(element, message) {
      $(element).parent().addClass('error');
      $('.ui.form').addClass('error');
      $('.error-message').text(message);
    }

    $('.submit-run').on('click', function () {
      let valid = true;
      let firstInvalid;
      $('.required input').each(function () {
        if ($(this).val() === '') {
          valid = false;
          firstInvalid = firstInvalid || $(this).attr('invalidname');
          $(this).parent().addClass('error');
        } else {
          $(this).parent().removeClass('error');
        }
      });

      $('.ui.form').removeClass('error');
      if (!valid) {
        formError(null, 'Invalid ' + firstInvalid + '.');
        return;
      }

      // Estimate format check
      let estimateRegex = /^(\d{1,2}):([0-5]\d):([0-5]\d)$/;
      let $estimateInput = $('input[name="estimate"]');
      if (!estimateRegex.test($estimateInput.val())) {
        formError($estimateInput, 'Invalid estimate.');
        return;
      }

      // Video format check
      let videoRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$/;
      let $videoInput = $('input[name="video"]');
      if (!videoRegex.test($videoInput.val())) {
        formError($videoInput, 'Invalid video.');
        return;
      }

      // Race check
      if (isRace) {
        if (selectedRunners.length === 0 || selectedRunners.length > 3) {
          formError(null, 'Invalid amount of runners specified.');
          return;
        }
      }

      // Availability check
      let $availabilityInput = $('.availability-textarea');
      if (!$availabilityInput.val() || $availabilityInput.val() === '') {
        formError($availabilityInput, 'Missing availability.');
        return;
      }

      $('.submit-waiting').removeClass('hidden');

      let data = {
        _csrf: _csrf,
        game: {
          name: $('input[name="game"]').val(),
          platform: $('input[name="platform"]').val(),
          region: $('input[name="region"]').val(),
          category: $('input[name="category"]').val(),
          estimate: $('input[name="estimate"]').val(),
          video: $('input[name="video"]').val(),
          leaderboards: $('input[name="leaderboards"]').val(),
          twitch_name: $('input[name="twitch-name"]').val()
        },
        isRace: isRace,
        runners: selectedRunners,
        availability: $('.availability-textarea').val(),
		comments: $('.comments-textarea').val(),
		incentives: $('.incentives-textarea').val()
      };

      // Do post!
      $.ajax({
        type: 'POST',
        url: '/api/user/submissions/submit',
        data: JSON.stringify(data),
        success: function () {
          $('.submit-waiting').addClass('hidden');
          $('.ui.form').addClass('success');
        },
        error: function (jqXHR, status, errString) {
          let err = JSON.parse(jqXHR.responseText);
          $('.submit-error-message-reason').text(errString);
          $('.submit-error').append(`<p>Affected elements: ${Object.keys(err).toString().replace(',', ', ')}</p><br>`);
          $('.submit-waiting').addClass('hidden');
          $('.submit-error').removeClass('hidden');
          $('.ui.form').addClass('error');
        },
        contentType: 'application/json',
        dataType: 'text'
      });

      let toFormat = $('.submit-success-message-game').html();
      let formatted = toFormat.replace('##game##', data.game.name).replace('##category##', data.game.category);
      $('.submit-success-message-game').html(formatted);
      $('.form-container').hide();
    });
  }

  if (!srComUsername) {
    $('.dimmer').dimmer({
      closable: false,
    }).dimmer('show');
  }

  if (!discordUsername) {
    $('.dimmer').dimmer({
      closable: false,
    }).dimmer('show');
  }
});
