jQuery.noConflict()( function($){
	"use strict";

	var Core = {
	
		/**
			Constructor
		**/
		initialize: function() {

			this.build();
			this.events();

		},
		/**
			Build page elements, plugins init
		**/
		build: function() {
		
			var self = this;
		
			$('html').removeClass('no-js');
		
			// Detect mobile browser
			if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				$('html').addClass('mobile');
			}
			
			// Detect IE
			if (navigator.appName == "Microsoft Internet Explorer") {
    		var ie = true;
    		var ua = navigator.userAgent;
    		var re = new RegExp("MSIE ([0-9]{1,}[.0-9]{0,})");
    		if (re.exec(ua) != null) {
        	var ieVersion = parseInt(RegExp.$1);
        	$('html').addClass('ie' + ieVersion );
    		}
			} 
			
			/**
				IE8 Placeholders
			**/
			$('.ie9 input[placeholder], .ie9 textarea[placeholder]').each( function() {
				$(this).val( $(this).attr('placeholder') );
				
				$(this).focus( function() {
					if( this.value == $(this).attr('placeholder') ) this.value = '';
				});
				
				$(this).blur( function() {
					if( $.trim( $(this).val() ) == '' ) $(this).val( $(this).attr('placeholder') );
				});
				
			});
			
			// Theme inputs, select
			var selects = $('select').not('select#sswitcher-primary-font, select#sswitcher-secondary-font');
			if( selects.length ) {
				
				selects.each( function() {
					
					$(this).selecter({
						customClass: "theme-select-input"
					});
					
				});
				
			}
			
			// pretty checkboxes
			$('input[type=radio], input[type=checkbox]').each( function() {
				$(this).on('ifChecked', function(event){
					
					$(this).attr('checked', 'checked').change();
					
				}).on('ifUnchecked', function() {
					
					var name = $(this).attr('name');
					$(this).removeAttr('checked').change();
					
				}).iCheck({
  				labelHover: false,
  				cursor: true
				});
			});
			
			// Add class to submenu with children
			$('#header-menu li').each( function() {
				if( $(this).find('ul').length ) {
					$(this).children('a:first').append('<span class="mobile-menu-toggle"></span>');
					$(this).addClass('has-children');
					$(this).parents('ul:first').addClass('has-submenu');
				}
			});
			
			$('.mobile-menu-toggle').click( function() {
				$(this).toggleClass('opened');
				$(this).parent().next('ul:first').toggle();
				return false;
			});
			
			// Masonry layout
			$('.posts-masonry').masonry({
  			itemSelector: '.item-masonry',
  			gutter: 30
			});
			
			$('.posts-masonry img').waitForImages({
				finished: function() {
					$('.posts-masonry').masonry({
  					itemSelector: '.item-masonry',
  					gutter: 30
					});
				}
			});
			
			// Toggles
			$('.toggle h4').click( function() {
		
				var top = $(this).parent().parent();
				var content = $(this).parent().find('.item-content');
				var icon = $(this).parent().find('i');
				var h = $(this);
		
				top.find('h4').removeClass('opened');

				if( content.is(':hidden') ) {
					top.find('.item-content').slideUp();
					top.find('i').removeClass('minus').addClass('plus');
					icon.removeClass('plus').addClass('minus');
					h.addClass('opened');
					content.slideDown();

				} else {
					icon.removeClass('minus').addClass('plus');
					content.slideUp();
				}
		
				return false;
			});
			
			// Tabs
			$('.tabs').each( function() {
				
				var tabID = $(this).attr('id');
				
				$(this).liquidSlider({
					autoHeight : true,
					dynamicArrows : false,
					includeTitle: false,
					panelTitleSelector : 'h4.title',
					navElementTag : 'div.tab',
					useCSSMaxWidth : false,
					slideEaseDuration: 800,
					heightEaseDuration: 800,
					callback: function(){
						
						self.initAnimations();

					},
					onload: function() {
						
						var newsTab = $( this.elem ).find('.tab-news .posts-carousel');
						
						if( newsTab.length ) {
							newsTab.each( function() {
								
								$(this).owlCarousel({
									items : 4,
									navigation : true,
									itemsDesktop : [9999,4],
									itemsDesktopSmall : [1199,3],
									itemsTablet: [959,2],
									itemsMobile : [767,1]
								});
								
							});
						}
						
					}
				});
				
			});
			
			// Logos carousel
			$('.logos-carousel').each( function() {
				
				$(this).owlCarousel({
					items : 1,
					navigation : true
				});
			
			});
			
			// headerimg carousel
			$('.headerimg-carousel').each( function() {
				
				$(this).owlCarousel({
					autoPlay : true,
					stopOnHover : true,
					singleItem : true
				});
			
			});
			
			// Add different style classes to different tabs
			$('.ls-wrapper').each( function() {
				var style = $(this).find('div.tabs').data('style');
				$(this).addClass( 'style-' + style );
			});
			
			// Tipsy
			$('.show-tooltip').each( function() {
				var g = $(this).data('gravity');
				g = g == undefined ? 's' : g;
				$(this).tipsy( { fade: true, gravity: g, opacity : '1' } );
			});
			
			// Header menu scrolling
			this.navMenu();
			
			// GoTop script
			if( $().UItoTop ) {
				$().UItoTop();
			}
			
			// Portfolio widget slider
			$('.widget .slider').each( function() {
			
				var parent = $(this).parent();
				var slider = $(this);
			
				$( this ).nivoSlider({
					directionNav: true,
					controlNav: false,
					afterChange: function() {
						var index = slider.data('nivo:vars').currentSlide;
						parent.find('.titles div.item').hide();
						parent.find('.titles div.item[data-number=' + index + ']').fadeIn();
					}
				});
				
			});
			
			// Post slider with thumbnails
			$('.post-gallery').each( function() {
			
				var parent = $(this);
				var slider = $(this).find('.slider');
			
				slider.nivoSlider({
					directionNav: true,
					controlNavThumbs: true,
					afterLoad: function() {
						
						parent.find('.nivo-controlNav').addClass('swiper-wrapper').wrap('<div class="nivo-controlNav_wrap swiper-container"></div>');
						parent.find('.nivo-controlNav_wrap').append('<div class="clear"></div>');
						parent.find('.nivo-control').addClass('swiper-slide');
						
						parent.find('.swiper-container').swiper({ 
  						loop: false, 
  						mode: 'horizontal',
  						slidesPerView: 'auto',
  						centeredSlides: false,
  						grabCursor: true,
  						freeMode: true
						});
						
					}
				});
				
			});
			
			/**
				Portfolio items
			**/
			var p_item_num = 0;
			
			if( $('.portfolio').length ) {
				
				$('.portfolio').each( function() {
					
					p_item_num++;
					
					var portfolioSwiper = $(this);
					
					//var uniqID = Math.round(new Date().getTime() + (Math.random() * 100));
					var uniqID = p_item_num;
					
					window.localStorage.setItem("picasso_grid_portfolio_items_" + uniqID, portfolioSwiper.find( '.portfolio-view-grid .swiper-wrapper' ).html() );
					
					// Grid view swiper
					var swiperGrid = portfolioSwiper.find('.portfolio-view-grid .swiper-container').swiper({ 
						loop: false, 
						mode: 'horizontal',
						slidesPerView: 'auto',
						centeredSlides: false,
						grabCursor: true,
						freeMode: true,
						scrollbar: {
        			container : '.swiper-scrollbar-grid',
        			draggable : true,
        			hide : false
    				}
					});
					
					// Flat view swiper
					var swiperFlat = portfolioSwiper.find('.portfolio-view-flat .swiper-container').swiper({ 
						loop: false, 
						mode: 'horizontal',
						slidesPerView: 'auto',
						centeredSlides: false,
						grabCursor: true,
						freeMode: true,
						scrollbar: {
        			container : '.swiper-scrollbar-flat',
        			draggable : true,
        			hide : false
    				}
					});
					
					$('.portfolio-view-flat').each( function() {
					
						var flatPItem = $(this);
					
						$(this).find('.item').hover( function() {
							
							var imgWidth = parseInt( $(this).find('img').width() );
							
							var add = imgWidth - 384;
							
							flatPItem.find('.swiper-wrapper').width( '+=' + add );
							$(this).stop().animate({ 'width' : '+=' + add }, 800, function() {
								swiperFlat.reInit();
							});
						}, function() {
							$(this).stop().animate({ 'width' : 384 }, 800, function() {
								swiperFlat.reInit();
							});
						});
					
					});
					
					// chage view
					var viewLinks = $(this).find('.filter-view a');
					viewLinks.click( function() {
						viewLinks.removeClass('current');
						$(this).addClass('current');
						
						if( $(this).hasClass('view-flat') ) {
							portfolioSwiper.find('.portfolio-view-grid').hide();
							portfolioSwiper.find('.portfolio-view-flat').show();
							swiperFlat.reInit();
							swiperFlat.swipeTo(0);
						} else {
							portfolioSwiper.find('.portfolio-view-grid').show();
							portfolioSwiper.find('.portfolio-view-flat').hide();
							swiperGrid.reInit();
							swiperGrid.swipeTo(0);
						}
						
						return false;
					});
					
					/**
						Portfolio filters functional
					**/
					var filterLinks = $(this).find('.filter-links a');
					filterLinks.click( function() {
						filterLinks.removeClass('current');
						$(this).addClass('current');
						
						var currentFilter = $(this).data('filter');
						var currentView = portfolioSwiper.find('.filter-view a.current').hasClass('view-flat') ? 'flat' : 'grid';
						
						// filter flat view
						var portfolioFlatItemsContainer = portfolioSwiper.find( '.portfolio-view-flat' );
						var flatViewPortfolioItems = portfolioSwiper.find('.portfolio-view-flat .item');
						
						var flatViewFilteredItems = currentFilter == '*' ? portfolioSwiper.find('.portfolio-view-flat .item' ) : portfolioSwiper.find('.portfolio-view-flat .item.filter-' + currentFilter );
						flatViewFilteredItems.addClass('bounceIn animated');
						
						var flatViewHiddenElements = flatViewPortfolioItems.not('.item.filter-' + currentFilter).addClass('bounceOut animated');
						
						portfolioFlatItemsContainer.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
							flatViewHiddenElements.removeClass('bounceIn bounceOut animated').hide();
							flatViewFilteredItems.removeClass('bounceIn bounceOut animated').show();
							portfolioSwiper.find('.swiper-scrollbar-flat').show();
							swiperFlat.reInit();
							swiperFlat.swipeTo(0);
						});	
						
						// filter grid view
						var portfolioGridItemsContainer = portfolioSwiper.find( '.portfolio-view-grid .swiper-wrapper' );
						var gridViewPortfolioItems = window.localStorage.getItem( "picasso_grid_portfolio_items_" + uniqID );
						
						if( currentFilter == '*' ) {
							portfolioGridItemsContainer.html( gridViewPortfolioItems );
							swiperGrid.reInit();
							swiperGrid.swipeTo(0);
							var allGridItems = portfolioGridItemsContainer.find('.item');
							allGridItems.addClass('bounceIn animated');
							
						} else {
							var filteredItems = $( gridViewPortfolioItems ).find('.item.filter-' + currentFilter);
							var newFilteredHTML = '';
							
							window.localStorage.setItem("picasso_grid_portfolio_i_" + uniqID, 0 );
							
							filteredItems.each( function() {
								var i = parseInt( window.localStorage.getItem("picasso_grid_portfolio_i_" + uniqID ) );
								
								if( i == 0 ) {
									newFilteredHTML += '<div class="swiper-slide">';
								}
								
								newFilteredHTML += '<div class="item">' + $(this).html() + '</div>';
								
								window.localStorage.setItem("picasso_grid_portfolio_i_" + uniqID, i + 1 );
								
								if( i == 1 ) {
									newFilteredHTML += '</div>';
									window.localStorage.setItem("picasso_grid_portfolio_i_" + uniqID, 0 );
								}
								
							});
							
							portfolioGridItemsContainer.html( newFilteredHTML );
							swiperGrid.reInit();
							swiperGrid.swipeTo(0);
							
							var allGridFilteredItems = portfolioGridItemsContainer.find('.item');
							allGridFilteredItems.addClass('bounceIn animated');
							
						}
						
						portfolioGridItemsContainer.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
							if( allGridItems ) {
								allGridItems.removeClass('bounceIn bounceOut animated');
							}
							if( allGridFilteredItems ) {
								allGridFilteredItems.removeClass('bounceIn bounceOut animated');
							}
							swiperGrid.reInit();
							
						});

						return false;
					});
					
					/**
						Portfolio lightbox
					**/
					var portfolioDiv = $(this);
					portfolioDiv.find('a.details').click( function() {
					
						var portfolioItemId = $(this).attr('href');
						var portfolioItem = $( portfolioItemId );
						
						self.showPortfolioLightbox( portfolioDiv, portfolioItem );
					
						return false;
					});
					
				});
				
				/**
					Portfolio lightbox close
				**/
				$('.portfolio-view-lightbox .overlay, .portfolio-view-lightbox a.close').click( function( e ) {					
					$('.portfolio-view-lightbox .item').hide();
					$('body').css('overflow', 'auto');
					$('.portfolio-view-lightbox').fadeOut();
					return false;
				});
				
				/**
					Portfolio lightbox navigation: pagination links
				**/
				$('.portfolio-view-lightbox .images-pagination a').click( function() {
					
					var portfolioItem = $(this).parents('.item');
					
					portfolioItem.find('.images-pagination a').removeClass('current');
					$(this).addClass('current');
					
					var index = portfolioItem.find( '.images-pagination a').index( $(this) );
					
					portfolioItem.find('.images img:visible').hide();
					portfolioItem.find('.images img:eq(' + index + ')').show();
					self.resizeLightBox();
					
					return false;
				});
				
				/**
					Portfolio lightbox navigation: prev / next image
				**/
				$('.next-image, .prev-image').click( function() {
					
					var portfolioItem = $(this).parents('.item');
					var index = portfolioItem.find( '.images-pagination a').index( portfolioItem.find( '.images-pagination a.current') );
					
					var newIndex = $(this).hasClass('next-image') ? parseInt( index + 1 ) : parseInt( index - 1 );
					
					if( ! portfolioItem.find('.images img:eq(' + newIndex + ')').length ) {
						newIndex = 0;
					}
					
					portfolioItem.find('.images-pagination a').removeClass('current');
					
					portfolioItem.find('.images img:visible').hide();
					portfolioItem.find('.images img:eq(' + newIndex + ')').show();
					portfolioItem.find('.images-pagination a:eq(' + newIndex + ')').addClass('current');
					
					self.resizeLightBox();
					
				});
				
				/**
					Portfolio lightbox navigation: prev / next project
				**/
				$('.next-project, .prev-project').click( function() {
					
					var portfolioItem = $(this).parents('.item');
					var portfolioDiv = $(this).parents('.portfolio');
					
					var index = portfolioDiv.find( '.item').index( portfolioItem );
					
					var newIndex = $(this).hasClass('next-project') ? parseInt( index + 1 ) : parseInt( index - 1 );
					
					if( ! portfolioDiv.find('.portfolio-view-lightbox .item:eq(' + newIndex + ')').length ) {
						newIndex = 0;
					}
					
					portfolioItem.find('.images-pagination, .next-image, .prev-image, .next-project, .prev-project, .close').hide();
					
					portfolioItem.fadeOut( 500, function() {
						
						portfolioItem = portfolioDiv.find('.portfolio-view-lightbox .item:eq(' + newIndex + ')');
						
						self.showPortfolioLightbox( portfolioDiv, portfolioItem );
						
					});
					
					return false;
				});
				
				/**
					Resize portfolio lightbox with window
				**/
				$(window).resize( function() {
					self.resizeLightBox();
				});
				
			}
			
			/**
				Body parallax
			**/
			$('section.parallax').each(function(){
				var parallaxItem = $(this);
				$(window).scroll(function() {
					var yPos = -($(window).scrollTop() / parallaxItem.data('parallax-speed')); 
					var coords = 'center '+ yPos + 'px';
					parallaxItem.css({ backgroundPosition: coords });
				});
			});
			
			/**
				Header slider
			**/
			if( $('#slider').length ) {
				var headerSlider = $('#slider').sequence({
					autoPlay: true,
					fallback: {
            theme: "fade",
            speed: 500
        	},
					autoPlayDelay: 5000,
					pagination: true,
					pauseOnHover: true,
					nextButton: true,
					animateStartingFrameIn: true,
					prevButton: true,
				}).data("sequence");
			}
			
			// full page media
			if( $('.media-page').length ) {
				$('.media-page .swiper-container').swiper({ 
					loop: false, 
					mode: 'horizontal',
					slidesPerView: 'auto',
					centeredSlides: false,
					grabCursor: true,
					freeMode: true
				});
				
				$('.media-page .swiper-container a').hover( function() {
					$('.media-page .swiper-container a').not( $(this) ).stop().fadeTo( 500, '0.3' );
				}, function() {
					$('.media-page .swiper-container a').stop().fadeTo( 500, '1' );
				});
				
				$('.media-page .swiper-container a').click( function() {
					
					var index = $('.media-page .swiper-container a').index( this );
					index++;
					
					headerSlider.goTo( index );
					
					return false;
				});
				
				$('#show-hide-media-thumbs').click( function() {
					
					$(this).toggleClass('closed');
					$('.thumbs').fadeToggle( 100 );
					$('.thumbnails').toggleClass('closed');
					
					return false;
				});
				
			}
		
			// Close preloader
			$(window).load(function() {
				if( $('body.preloader').length ) {
					
					$('body').waitForImages({
						waitForAll: true,
						finished: function() {
							$('#preloader').fadeOut( 800, function() {
								$('body.preloader').removeClass('preloader');
								$(this).remove();
							});
						}
					});
					
					if( $('.ie7, .ie8, .ie9, .ie10').length ) {
						$('#preloader').remove();
						$('body').removeClass('preloader');
					}
					
				}

				// cookies - setup when uploaded to server
				// document.cookie = "lang=ru";
				// console.log(document.cookie);

				$('#lang-ru').click(function() {
					$('.en').hide();
					$('.ru').show();
				  });
				
				$('#lang-en').click(function() {
					$('.en').show();
					$('.ru').hide();
				});
				
			});
		
		},
		/**
			Set page events
		**/
		events: function() {
		
			var self = this;
			
			// toggle mobile menu
			$('#phone-toggle-menu').click( function() {
				$('#header-menu').toggleClass('hide-on-phone hide-on-tablet').toggleClass('opened');
				$(this).toggleClass('opened');
				return false;
			});
			
			// pricing tables on-hover transform
			$('.pricing-table.flip .unit').mouseenter( function(e) {
				if( $(window).width() > 1199 && $(e.target).hasClass('button') == false ) {
					$(this).toggleClass('hover');
				}
			}).mouseleave( function(e){
				if( $(window).width() > 1199 && $(e.target).hasClass('button') == false ) {
					$(this).toggleClass('hover');
				}
			});
			
			/*
			$('.pricing-table.flip .unit').click( function(e) {
				if( $(window).width() > 1199 && $(e.target).hasClass('button') == false ) {
					$(this).toggleClass('hover');
				}
			});*/
			
			/**
				Tap header menu
			**/
			$('.mobile #header-menu > li a').on('click', function() {
				var submenu = $(this).next('ul');
				if( submenu.length ) {
					submenu.show();
					return false;
				}
			});
			
			// Set min-height for pricing tables
			$(window).load(function(){
				self.setupFlippedTables();
			});
			
			$( window ).resize(function() {
				self.setupFlippedTables();
			});
			
			// close alert boxes
			$( '.alert' ).click( function() {
				$( this ).fadeOut( 400, function() {
					$( this ).remove();
				});
			});
			
			// display sharer
			$('a.display-sharer').click( function() {
				$(this).parents('.actions').find('.sharer').slideToggle();
			});
			
			$('a.display-sharer').mouseenter( function(e) {
				$(this).parents('.actions').find('.sharer').slideToggle();
			});
			
			$('.sharer').mouseleave( function(e){
				$(this).slideToggle();
			});
			
			// handle contact form
			this.handleContactForm();
			
			// headerimg section
			$('body.home-page section.headerimg').each( function() {
				
				var section = $(this);
				var items = section.find('.item');
				var links = section.find('.pages a');
				
				links.on( 'click tap', function() {
					
					var currentPage = links.index( $(this) );
					items.hide();
					links.removeClass('current');
					items.eq( currentPage ).fadeIn();
					$(this).addClass('current');
					
					return false;
				});
				
			});
			
			// init CSS animations
			this.initAnimations();
			
			// init lightbox
			if( $('a.lightbox').length ) {
				$('a.lightbox').nivoLightbox({
					effect: 'fadeScale'
				});				
			}
		
		},
	
		/**************************************************************************************************************************
			Class methods
		**************************************************************************************************************************/
		/**
			Display portfolio lightbox
		**/
		showPortfolioLightbox: function( portfolioDiv, portfolioItem ) {
			
			var self = this;
			
			portfolioDiv.find('.portfolio-view-lightbox').fadeIn();

			portfolioItem.find('img').waitForImages({
				finished: function() {
								
					$('body').css('overflow', 'hidden');
					portfolioItem.show();
					portfolioItem.find('.images > img').hide();
					portfolioItem.find('.images > img:first').fadeIn(400, function() {
					
						portfolioItem.find('a.close').show();
						portfolioItem.find('.images-pagination a').removeClass('current');
						portfolioItem.find('.images-pagination a:first').addClass('current');
						
						portfolioItem.find('.images-pagination, .next-image, .prev-image').hide();
					
						if( portfolioItem.find('.images img').length >= 2 ) {
							portfolioItem.find('.images-pagination, .next-image, .prev-image').show();
						}
									
						if( portfolioDiv.find('.item').length >= 2 ) {
							portfolioItem.find('.next-project, .prev-project').show();
						} 
									
						self.resizeLightBox();
					});
					
				}
			});
						
			portfolioItem.find('img').each( function() {
				if( ! $(this).attr('src') )
					$(this).attr('src', $(this).data('src') );
			});
			
		},
		
		/**
			Resize lightbox portfolio window
		**/
		resizeLightBox: function() {
			
			if( $('.portfolio-view-lightbox:visible').length ) {
				var descWidth = $('.portfolio-view-lightbox img:visible').width();
				$('.portfolio-view-lightbox .item:visible').find('.description').width( descWidth ).fadeIn();
			}
			
		},
		
		/**
			Header menu scroll
		**/
		navMenu: function() {
			
			// one page nav
    	if( $('body.template-home-one-page').length ) {

				$('#header-menu').onePageNav({
					currentClass: 'current-menu-item',
					changeHash: false,
 					scrollSpeed: 750,
  				scrollOffset: 85,
  				filter: ':not(.external)'
				});
				
			}
			
			
		    if( $('body.template-home-one-page').length ) {

				$('#header-slide').onePageNav({
					currentClass: 'current-menu-item',
					changeHash: false,
 					scrollSpeed: 750,
  				scrollOffset: 85,
  				filter: ':not(.external)'
				});
				
			}	
			if( $('html').hasClass('mobile') == false && $('body').hasClass('error404') == false ) {
				
				var el = $('#header');
				var elpos_original = el.offset().top;
		
				$(window).scroll(function(){
					var elpos = el.offset().top;
 					var windowpos = $(window).scrollTop();
  				var finaldestination = windowpos;
  				var body = $('body');
  	            //menu
  				if( $(window).width() > 260 ) {
  					
  					if(windowpos<=elpos_original) {
   						finaldestination = elpos_original;
   						
     					el.removeClass('scrolled').attr('style', '');
      				body.removeClass('scrolling')
      				
  					} else {
  						
  						if( body.hasClass('scrolling') == false ) {
  							body.addClass('scrolling');
  						}
  						
  						if( el.hasClass('scrolled') == false ) {
  							el.addClass('scrolled').animate({
    							top: "0px"
  							}, 1000 );
  						}

 						}
  				} else {
 						el.removeClass('scrolled').attr('style', '');
  				}
				});
				
			}
			
			$( window ).resize(function() {
				if( $(window).width() < 959 ) {
					$('#header').removeClass('scrolled');
					$('body').removeClass('scrolling');
				} else {
					$('li.has-children > ul').show().removeAttr('style');
				}
			});

		},
		
		/**
			Calculate flipped tables min-height
		**/
		setupFlippedTables: function() {
		
			if( $(".pricing-table.flip").length && $(window).width() > 1199 ) {
				$(".pricing-table.flip").each( function() {
				
					var pricingUnitMaxHeight = Math.max.apply( null, $(this).find(".inside").map(function () {
 						return $(this).outerHeight(true);
					}).get());
			
					$(this).find('.unit').css('min-height', pricingUnitMaxHeight + 'px');
				
				});
			}
		
		},
		
		/**
			Handle contact form
		**/
		handleContactForm: function() {
			
			var self = this;
			
			$('#contact-form input, #contact-form textarea').tipsy({trigger: 'manual', gravity: 'sw', fade: true});
			
			$('#contact-form').submit( function() {
				
				var form = $(this);
				
				var nameInput = $('#input-name');
				var name = nameInput.val();
		
				var emailInput = $('#input-email');
				var email = emailInput.val();
				
				var subject = $('#input-subject').val();
				
				var messageInput = $('#input-message');
				var message = messageInput.val();
				
				if( $.trim( name ) == '' ) {
					nameInput.attr('title', 'Please enter your name').tipsy("show").focus();
					return false;
				} else {
					nameInput.tipsy("hide");
				}
					
				if( $.trim( email ) == '' || !self.isValidEmailAddress( email ) ) {
					emailInput.attr('title', 'Please enter valid email address').tipsy("show").focus();
					return false;
				} else {
					emailInput.tipsy("hide");
				}
					
				if( $.trim( message ) == '' ) {
					messageInput.attr('title', 'Please enter a message').tipsy("show").focus();
					return false;
				} else {
					messageInput.tipsy("hide");
				}
					
				$.ajax({
					url: 'contact-form.php',
					type: "POST",
					data: {
						'name' : name,
						'email' : email,
						'subject' : subject,
						'message' : message
					},
					beforeSend: function() {
						$('#contact-form input, #contact-form textarea, #contact-form button').attr('disabled', 'disabled');
						$('#contact-form').fadeTo(500, '0.7');
					},
					success: function() {
				
						form.html( '<h3 class="success">Your message has been sent. Thank you!</h3>' ).css('opacity', '1');
				
					}
				});
				
				return false;
			});
			
		},
		
		/**
			Show animations for elements
		**/
		initAnimations: function() {
	
			if( $("html").hasClass("mobile") ) {
				$("[data-appear-animation]").each( function() {
					
					if( $(this).data("appear-animation") == 'animateWidth' ) {
						$(this).css('width', $(this).data("width"));
					}
					
				});
				return false;
			}
	
			$("[data-appear-animation]").each(function() {

				var self = $(this);
				
				var animation = self.data("appear-animation");
				
				var delay = (self.data("appear-animation-delay") ? self.data("appear-animation-delay") : 0);
		
				if( $(window).width() > 959 ) {
				
					self.appear(function() {
					
						setTimeout(function() {
							
							if( animation == 'animateWidth' ) {
								self.css('width', self.data("width"));
							} else if( animation == 'animateDigits' ) {
								var from = self.data('from');
								var to = self.data('to');
								self.numinate({ format: '%counter%', from: from, to: to, runningInterval: 2000, stepUnit: 5});
							} else {
									
								self.css("animation-delay", delay + "s").css("-webkit-animation-delay", delay + "s");
					
								self.addClass( animation );
									
								self.addClass("animated");
								
								self.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
									$(this).removeClass('animated').removeClass( animation );
								});	
									
							}
						
						}, delay);
					
					}, {accX: 0, accY: -50});
				
				} else {
					if( animation == 'animateWidth' ) {
						self.css('width', self.data("width"));
					}
				}
			});
	
		},
		/**************************************************************************************************************************
			Utils
		**************************************************************************************************************************/
		/**
			Check email address
		**/
		isValidEmailAddress: function( emailAddress ) {
			var pattern = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
 			return pattern.test( emailAddress );
		}
		
	}

	Core.initialize();

});