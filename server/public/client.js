fbimg = function(id) {
  return "<img src='http://graph.facebook.com/" + id + "/picture?type=large' />";
}

header = function(bool) {
  return bool ? "Yup!" : "Nope!";
}

window.fbAsyncInit = function() {
    FB.init({
        appId : '330392253659950',
        status : true, 
        cookie : true,
        xfbml : true,
        oauth : true,
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

$(function(){
  $('.fb-login-button').click(function(){
    $('#header').slideUp();
    FB.login(function(response) {
      var spinner = new Spinner({
        lines: 12, // The number of lines to draw
        length: 7, // The length of each line
        width: 3, // The line thickness
        radius: 10, // The radius of the inner circle
        color: '#000', // #rbg or #rrggbb
        speed: 1,         // Rounds per second
        trail: 100,       // Afterglow percentage
        shadow: false     // Whether to render a shadow
      }).spin(document.getElementById("loading_spinner"));
      $("#loading_spinner").slideDown();

      if (response.authResponse) {
        $.getJSON('get_entry', {token : FB.getAccessToken() }, function(data) {
          console.log(data);

          people = $('#people_wrapper a.person');
          person1div = $(people[0]);
          person2div = $(people[1]);

          $(".front h3", person1div).html(data.friend1.first_name);
          $(".front h3", person2div).html(data.friend2.first_name);

          $(".front .image_128", person1div).html(fbimg(data.friend1.id));
          $(".front .image_128", person2div).html(fbimg(data.friend2.id));

          $(".front .image_128", person1div).html(fbimg(data.friend1.id));

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

          $('#loading_spinner').slideUp();
          $('#question').slideDown();
        });
      } else {
        console.log('User cancelled login or did not fully authorize.');
      }
    }, {scope: 'read_friendlists,friends_status'});
  });

  $(".person").click(function(){
    $(this).addClass('clicked');
    if ($(this).hasClass('no')) {
      setTimeout(function() {
        if (!$('.person.yes.clicked').length) {
          $('.person.yes .back h3').hide();
          $('.person.yes .back p').hide();
          $('.person.yes .back p.wrong').show();
          $('.person.yes').addClass('clicked');
        }
      }, 1000);
    }
  });
});
