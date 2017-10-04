(function($){

    $.extend($.easing, {
        easeInOutCubic : function(x, t, b, c, d){
            if ((t/=d/2) < 1) return c/2*t*t*t + b;
            return c/2*((t-=2)*t*t + 2) + b;
        }
    });

    $.fn.outerFind = function(selector){
        return this.find(selector).addBack(selector);
    };
 

    $.isMobile = function(type){
        var reg = [];
        var any = {
            blackberry : 'BlackBerry',
            android : 'Android',
            windows : 'IEMobile',
            opera : 'Opera Mini',
            ios : 'iPhone|iPad|iPod'
        };
        type = 'undefined' == $.type(type) ? '*' : type.toLowerCase();
        if ('*' == type) reg = $.map(any, function(v){ return v; });
        else if (type in any) reg.push(any[type]);
        return !!(reg.length && navigator.userAgent.match(new RegExp(reg.join('|'), 'i')));
    };

    $(function(){

        $('html').addClass($.isMobile() ? 'mobile' : 'desktop');

        // .mbr-fullscreen
        (function(width, height){
            var deviceSize = [width, width];
            deviceSize[height > width ? 0 : 1] = height;
            $(window).resize(function(){
                var windowHeight = $(window).height();
                // simple fix for Chrome's scrolling
                if ($.isMobile() && navigator.userAgent.match(/Chrome/i) && $.inArray(windowHeight, deviceSize) < 0)
                    windowHeight = deviceSize[ $(window).width() > windowHeight ? 1 : 1 ];
                $('.mbr-fullscreen').each(function(){
                    $(this).css('height', windowHeight + 'px');
                });
            });
        })($(window).width(), $(window).height());
 

        // 19 by 9 blocks autoheight
        function calculate16by9($item) {
            $item.each(function(){
                $(this).css('height', $(this).parent().width() * 9 / 16);
            });
        }
        $(window).resize(function(){
            calculate16by9($('.mbr-section--16by9'));
        });
        $(document).on('add.cards change.cards', function(event){
            var enabled = $(event.target).outerFind('.mbr-section--16by9');

            if(enabled.length) {
                enabled.attr('data-16by9', 'true');
                calculate16by9(enabled);
            } else {
                var destroy = $(event.target).outerFind('[data-16by9]');
                destroy.css('height', '');
                destroy.removeAttr('data-16by9');
            }
        });
 
        $(document).on('add.cards', function(event){
            if (window.google && google.maps){
                $(event.target).outerFind('.mbr-google-map').each(function(){
                    loadGoogleMap.call(this);
                });
            }
        });

        // embedded videos
        $(window).resize(function(){
            $('.mbr-embedded-video').each(function(){
                $(this).height(
                    $(this).width() *
                    parseInt($(this).attr('height') || 0) /
                    parseInt($(this).attr('width') || 0)
                );
            });
        });
        $(document).on('add.cards', function(event){
            if ($('html').hasClass('mbr-site-loaded') && $(event.target).outerFind('iframe').length)
                $(window).resize();
        });
        // background video
        var updateBgImgPosition = function(img){
            var win = {
                width : img.parent().outerWidth(),
                height : img.parent().outerHeight()
            };
            var ratio = '16/9';
            var margin = 24;
            var overprint = 100;
            var css = {};
            css.width = win.width + ((win.width * margin) / 100);
            css.height = ratio == '16/9' ? Math.ceil((9 * win.width) / 16) : Math.ceil((3 * win.width) / 4);
            css.marginTop = -((css.height - win.height) / 2);
            css.marginLeft = -((win.width * (margin / 2)) / 100);
            if (css.height < win.height){
                css.height = win.height + ((win.height * margin) / 100);
                css.width = ratio == '16/9' ? Math.floor((16 * win.height) / 9) : Math.floor((4 * win.height) / 3);
                css.marginTop = -((win.height * (margin / 2)) / 100);
                css.marginLeft = -((css.width - win.width) / 2);
            }
            css.width += overprint;
            css.height += overprint;
            css.marginTop -= overprint / 2;
            css.marginLeft -= overprint / 2;
            img.css(css);
        };
        $(window).resize(function(){
            $('.mbr-background-video-preview img').each(function(){
                updateBgImgPosition($(this));
            });
            $('.mbYTP_wrapper iframe').each(function(){
                updateBgImgPosition($(this));
            });
        });
        $(document).on('add.cards', function(event){
            $(event.target).outerFind('[data-bg-video]').each(function(){
                var result, videoURL = $(this).data('bg-video'), patterns = [
                    /\?v=([^&]+)/,
                    /(?:embed|\.be)\/([-a-z0-9_]+)/i,
                    /^([-a-z0-9_]+)$/i
                ];
                for (var i = 0; i < patterns.length; i++){
                    if (result = patterns[i].exec(videoURL)){
                        var previewURL = 'http' + ('https:' == location.protocol ? 's' : '') + ':';
                        previewURL += '//img.youtube.com/vi/' + result[1] + '/maxresdefault.jpg';
                        $('.vidpreview:eq(0)', this).before(
                            $('<img>')
                                .hide()
                                .wrap('<div class="mbr-background-video-preview"></div>')
                                .on('load', function(){
                                    if (120 == (this.naturalWidth || this.width)){

                                        // selection of preview in the best quality
                                        var file = this.src.split('/').pop();
                                        switch (file){
                                            case 'maxresdefault.jpg':
                                                this.src = this.src.replace(file, 'sddefault.jpg');
                                                break;
                                            case 'sddefault.jpg':
                                                this.src = this.src.replace(file, 'hqdefault.jpg');
                                                break;
                                        }
                                        
                                    } else $(this).show();
                                })
                                .attr('src', previewURL)
                                .parent()
                        );
                        if ($.fn.YTPlayer && !$.isMobile()){
                            var params = eval('(' + ($(this).data('bg-video-params') || '{}') + ')');
                            $('.vidpreview:eq(0)', this).before('<div class="mbr-background-video"></div>').prev()
                                .YTPlayer($.extend({
                                    videoURL : result[1],
                                    containment : 'self',
                                    showControls : false,
                                    mute : false
                                }, params));
                        }
                        break;
                    }
                }
            });
        });

        // init
        $('body > *:not(style, script)').trigger('add.cards');
        $('html').addClass('mbr-site-loaded');
 
 

    });

})(jQuery);
 
