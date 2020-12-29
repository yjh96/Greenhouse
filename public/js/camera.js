$(document).ready(() => {
    console.log("loaded")
    // 카메라
    const contorl_camera = document.getElementById("camera");

    contorl_camera.addEventListener('click',PHOTO,false);
    function PHOTO () {
        $.ajax({
            url : "/photo",
            type : 'POST',
            success : function(req,res){
                console.log("Success Post to server >>PHOTO<<");

                $.mobile.loading( "show", {
                    text: "Reloading...",
                    textVisible: true,
                    theme: "b",
                    textonly: false,
                    inline: true
                });
                setTimeout(function(){
                    $('#photo-upload').attr('src','https://storageaccountstudyb43c.blob.core.windows.net/camera/Test/photo.jpg?' + new Date().getTime());
                    console.log("reload");
                    $.mobile.loading( "hide" );
                },5000);
            }
        });
    }
});


$( document ).on( "click", ".show-page-loading-msg", function() {

})
    .on( "click", ".hide-page-loading-msg", function() {
        $.mobile.loading( "hide" );
    });