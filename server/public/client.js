NEW_TIMER = 5000;

fbimg = function(id) {
  return "<img src='http://graph.facebook.com/" + id + "/picture?type=large' />";
}

header = function(bool) {
  return bool ? "Yup!" : "Nope!";
}

reinit = function() {
  $('.yes').removeClass('yes');
  $('.no').removeClass('no');
  $('.clicked').removeClass('clicked');
}

//#next_spinner_container
getQuestion = function() {
  $('#header').slideUp();
  $('#question').slideUp();
  reinit();
  $("#loading").slideDown();
  fetchQuestion();
}

getNewQuestion = function() {
  $('#header').slideUp();
  $('#question').slideUp();
  reinit();
  $("#next_spinner_container").slideDown();
  fetchQuestion();
}

fetchQuestion = function() {
  $.getJSON('get_entry', {token : FB.getAccessToken() }, function(data) {
    console.log(data);

    people = $('#people_wrapper a.person');
    person1div = $(people[0]);
    person2div = $(people[1]);

    $(".front h3", person1div).html(data.friend1.first_name);
    $(".front h3", person2div).html(data.friend2.first_name);

    $(".front .image_128", person1div).html(fbimg(data.friend1.id));
    $(".front .image_128", person2div).html(fbimg(data.friend2.id));

    $(person1div).addClass(data.quote.from.id == data.friend1.id ? 'yes' : 'no');
    $(person2div).addClass(data.quote.from.id == data.friend2.id ? 'yes' : 'no');

    $(".back h3", person1div).html(header(data.quote.from.id == data.friend1.id));
    $(".back h3", person2div).html(header(data.quote.from.id == data.friend2.id));

    $(".back p.first", person1div).html(function(){
      if (data.quote.from.id == data.friend1.id) return data.friend1.first_name + " said that!";
      else return data.friend1.first_name + " didn't say that.";
    });
    $(".back p.first", person2div).html(function(){
      if (data.quote.from.id == data.friend2.id) return data.friend2.first_name + " said that!";
      else return data.friend2.first_name + " didn't say that.";
    });

    $(".back p.wrong", person1div).html(function(){
      return "It was " + data.friend1.first_name + "!";
    });
    $(".back p.wrong", person2div).html(function(){
      return "It was " + data.friend2.first_name + "!";
    });

    $('#quote p').html(data.quote.message);

    $('#loading, #next_spinner_container').slideUp();
    $('#question').slideDown();
  });
}

window.fbAsyncInit = function() {
  FB.init({
      appId : '330392253659950',
      status : true, 
      cookie : true,
      xfbml : true,
      oauth : true,
  });

  FB.getLoginStatus(function(response){
    if(response.status === 'connected'){
      $('.fb-login-button').hide();
      $('.start').css('display', 'block');
      $(".start").click(function(e){
        $('.start').slideUp();
        e.preventDefault();
        getQuestion();
      });
    } else $('.fb-login-button').fadeIn();
  });

  FB.Event.subscribe('auth.login', function(response) {
    console.log(response);
    if (response.authResponse) {
      $('.fb-login-button').fadeOut();
      getQuestion();
    } else {
      console.log('User cancelled login or did not fully authorize.');
    }
  });

  $(".person").click(function(e){
    e.preventDefault();
    $(this).addClass('clicked');
    if ($(this).hasClass('no')) {
      setTimeout(function() {
        if (!$('.person.yes.clicked').length) {
          $('.person.yes .back h3').hide();
          $('.person.yes .back p').hide();
          $('.person.yes .back p.wrong').show();
          $('.person.yes').addClass('clicked');
          setTimeout(function() {
            getNewQuestion();
          }, NEW_TIMER);
        }
      }, 1000);
    } else {
      setTimeout(function() {
        getNewQuestion();
      }, NEW_TIMER);
    }
  });
};
(function(d){
    var js, id = 'facebook-jssdk';
    if (d.getElementById(id)) {
        return;
    }
    js = d.createElement('script');
    js.id = id;
    js.async = true;
    js.src = "//connect.facebook.net/en_US/all.js";
    d.getElementsByTagName('head')[0].appendChild(js);
}(document));
