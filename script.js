$( document ).ready(function() {

	//palauttaa tämän päivän esim. muodossa Ma 01.01
	function getDate() {
		var d = new Date();
		var date = ('0'+d.getDate()).slice(-2);
		var month = ('0'+(d.getMonth()+1)).slice(-2);
		var weekdayNames = ['Su','Ma','Ti','Ke','To','Pe','La'];
		var weekday = weekdayNames[d.getDay()];
		return weekday + ' ' + date + '.' + month;
	}

	//palauttaa tätä päivää vastaavan taulukkoindeksin
	function getArrayIndex() {
		var dateNow = getDate();
		var arrayIndex = null;
		var data = JSON.parse(ruokalat[0].data);

		//etsitään oikea viikonpäivä listasta
		var j=0;
		while(j<data.data.length) {
			if(data.data[j].date == dateNow) {
				arrayIndex = j;
				break;
			}
			j++;
		}
		ruokalatIndex = arrayIndex;
		return arrayIndex;
	}

	//hakee suosikit localStoragesta
	function getFavorites() {
		for(var i=0; i<localStorage.length; i++) {
			if(localStorage.key(i) != "ravintolat")
				getMenus(localStorage.key(i));
		}
	}

	//luo listan ravintoloista
	function getRestaurants() {
		var ravintolat = localStorage.getItem("ravintolat");
		if(ravintolat != null) {
			makeList(ravintolat);
		}	else {
			$.ajax({
				url: "https://messi.hyyravintolat.fi/publicapi/restaurants"
			}).done(function(res) {
				var data = JSON.stringify(res);
				localStorage.setItem("ravintolat",data);
				makeList(data);
			});
		}

		function makeList(data) {
			data = JSON.parse(data);
			// Laitetaan ravintola listaan
			var ruokalat = [];
			ruokalat.push ('<option>**Valitse ravintola**</option>');
			for(var i=0; i<data.data.length; i++) {
				ruokalat.push ('<option areacode="'+data.data[i].areacode+'" id="'+data.data[i].id+'">'+data.data[i].name+'</option>');
			}
			$(".ruokalat").append(ruokalat.join(""));
		}
	}

	//hakee ruokalistat hyyravintoloilta
	function getMenus(id) {
		var data = localStorage.getItem(id);
		var parseData = JSON.parse(localStorage.getItem(id));
		var vanhenemisaika = 604800000; // 7 päivää millisekunteina

		//tarkastetaan, että dataa on ja se on tuoretta
		if(data != null && parseData.timestamp + vanhenemisaika > Date.now()) {
			ruokalat.push( {id:id, data:data} );
				showMenus(ruokalatIndex);
				uiElements();
		} else {
			$.ajax({
					url: "https://messi.hyyravintolat.fi/publicapi/restaurant/"+id
				}).done(function(res) {
					//luodaan uusi ominaisuus timestamp
					res.timestamp = Date.now();
					//tallennetaan data localStorageen
					data = JSON.stringify(res);
					localStorage.setItem(id, data);
					//tallennetaan data taulukkoon
					ruokalat.push( {id:id, data:data} );
					showMenus(ruokalatIndex);
					uiElements();
			});
		}
	}

	//näyttää ruokalistat halutuista ravintoloista
	function showMenus(arrayIndex) {
		if(ruokalatIndex == -1) {
			arrayIndex = getArrayIndex();
		}
		var menus = [];
		var data = JSON.parse(ruokalat[0].data);
		$('#pvm').text(data.data[arrayIndex].date);

		$('.ruokalistat').html('');

		for(var i=0; i<ruokalat.length; i++) {
			data = JSON.parse(ruokalat[i].data);
			var id = ruokalat[i].id;

			$('.ruokalistat').append('<div id="r'+id+'" class="ruokalista">'+
				'<h3>'+ data.information.restaurant +'</h3>' +
				'<button type="button" class="remove btn btn-default">'+
					'<span class="glyphicon glyphicon-remove-circle" aria-hidden="true"></span>'+
				'</button>'+
			'</div>');

			var ruokalista = [];

			if(data.data[arrayIndex].data.length < 1)
				ruokalista.push("Ei lounastietoja.");
			else {
				for(var j=0; j<data.data[arrayIndex].data.length; j++) {
					ruokalista.push("<p>" + data.data[arrayIndex].data[j].name + "<b> " + data.data[arrayIndex].data[j].price.name + "</b></p>");
				}
			}
			$("#r"+id).append(ruokalista.join(""));
		}
	}

	function uiElements() {
		if(ruokalat.length < 1) {
			$('.paivamaara').css('display','none');
			$('.info').css('display','inline');
		} else {
			$('.paivamaara').css('display','inline');
			$('.info').css('display','none');
		}
	}

	$(".ruokalat").change( function() {
	  $( "select option:selected" ).each(function() {
			if(this.id != "") {
				//estetään saman ruokalan valinta
				$('#'+this.id).attr("disabled", true);
				getMenus(this.id);
			}
	  });
 	});

	$('.ruokalistat').on('click','.remove', function () {
		var id = $(this).parent().attr("id");
		var idnumber = (id.slice( id.indexOf("r")+1));
		//poistetaan listasta
		var i=0;
		while(i<ruokalat.length) {
			if(ruokalat[i].id == idnumber)
				ruokalat.splice(ruokalat[i],1);
			i++;
		}
		//poistetaan muistista
		localStorage.removeItem(idnumber);
		$(this).parent().remove();
		//pystyy taas valitsemaan listasta
		$('#'+idnumber).attr("disabled", false);
		uiElements();
	});

	$('#edellinen').click( function(){
		if(ruokalat.length > 0) {
			if(ruokalatIndex > 0) {
				ruokalatIndex--;
				$('#seuraava').attr("disabled", false);
				showMenus(ruokalatIndex);
			}
			else {
				$('#edellinen').attr("disabled", true);
			}
		}
	});

	$('#seuraava').click( function(){
		if(ruokalat.length > 0) {
			if(ruokalatIndex < 13) {
				ruokalatIndex++;
				$('#edellinen').attr("disabled", false);
				showMenus(ruokalatIndex);
			}
			else {
				$('#seuraava').attr("disabled", true);
			}
		}
	});

	//kaikki käyttäjän valitsemat ruokalat
	var ruokalat = [];
	//minkä päivän ruokalista näytetään
	var ruokalatIndex = -1;

	uiElements();
	getRestaurants();
	getFavorites();
});
