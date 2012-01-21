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
  $('.login').click(function(){
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
              $('#loading_spinner').slideUp();
              $('#question').slideDown();
          });
      }
      else {
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
