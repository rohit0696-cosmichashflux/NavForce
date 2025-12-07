<script>
    const apikey = "ceab17408b64b434ef18931a8fe62d98";

    let lastForecastData = null;
    let lastMarineForecast = null;
    let lastMarker = null;
    let markers = [];
    let legSpeeds = [];
    let legTrackTypes = [];
    let legLines = [];

    const weatherPanel = document.getElementById("weatherPanel");
    const panelContent = document.getElementById("panelContent");
    const closePanel = document.getElementById("closePanel");

    const forecastBar = document.getElementById("forecastBar");
    const forecastItems = document.getElementById("forecastItems");
    const forecastStepSelect = document.getElementById("forecastStep");
    const toggleForecastBtn = document.getElementById("toggleForecastBtn");
    const hideForecastBtn = document.getElementById("hideForecastBtn");

    const placeInput = document.getElementById("placeInput");
    const placeGo = document.getElementById("placeGo");
    const cursorLatLon = document.getElementById("cursorLatLon");
    const enableWaypointsTop = document.getElementById("enableWaypointsTop");
    const routeDetailsDiv = document.getElementById("routeDetails");
    const vesselSpeedInput = document.getElementById("vesselSpeed");
    const departureUtcInput = document.getElementById("departureUtc");
    const routeTableBody = document.getElementById("routeTableBody");
    const departureGoBtn = document.getElementById("departureGoBtn");
    const routeResetBtn = document.getElementById("routeResetBtn");
    const routeExpandBtn = document.getElementById("routeExpandBtn");
    const routeToggleMobile = document.getElementById("routeToggleMobile");
    const homeBtn = document.getElementById("homeBtn");
    const contactBtn = document.getElementById("contactBtn");
    const zoomInBtn = document.getElementById("zoomInBtn");
    const zoomOutBtn = document.getElementById("zoomOutBtn");
    const downloadPdfBtn = document.getElementById("downloadPdfBtn");
    const latLonGo = document.getElementById("latLonGo");

    let consoleExpanded = false;

    const map = L.map("map",{worldCopyJump:true}).setView([20,0],2);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{
      maxZoom:19,minZoom:1,attribution:"© OpenStreetMap contributors"
    }).addTo(map);

    homeBtn.onclick = () => { window.location.href = "index.html"; };
    contactBtn.onclick = () => { window.location.href = "contact.html"; };
    zoomInBtn.onclick = () => map.zoomIn();
    zoomOutBtn.onclick = () => map.zoomOut();

    function wrapLon180(lon){
      lon = ((lon + 180) % 360 + 360) % 360 - 180;
      return lon;
    }
    function toRad(d){return d*Math.PI/180;}
    function toDeg(r){return r*180/Math.PI;}

    // --- Standard ocean surface currents (very coarse climatology) ---
    const standardCurrents = [
      // Atlantic
      {
        name: "North Equatorial Current (Atl)",
        basin: "Atlantic",
        speedKn: 0.6,
        dirDeg: 270,
        latMin: 5, latMax: 20,
        lonMin: -60, lonMax: -15
      },
      {
        name: "South Equatorial Current (Atl)",
        basin: "Atlantic",
        speedKn: 0.6,
        dirDeg: 270,
        latMin: -20, latMax: 0,
        lonMin: -40, lonMax: 10
      },
      {
        name: "Equatorial Countercurrent (Atl)",
        basin: "Atlantic",
        speedKn: 0.5,
        dirDeg: 90,
        latMin: -3, latMax: 5,
        lonMin: -40, lonMax: 10
      },
      {
        name: "Gulf Stream",
        basin: "Atlantic",
        speedKn: 1.5,
        dirDeg: 45,
        latMin: 25, latMax: 45,
        lonMin: -80, lonMax: -40
      },
      {
        name: "Canary Current",
        basin: "Atlantic",
        speedKn: 0.4,
        dirDeg: 210,
        latMin: 10, latMax: 35,
        lonMin: -30, lonMax: -5
      },
      {
        name: "Brazil Current",
        basin: "Atlantic",
        speedKn: 0.7,
        dirDeg: 225,
        latMin: -35, latMax: -15,
        lonMin: -55, lonMax: -35
      },
      {
        name: "Benguela Current",
        basin: "Atlantic",
        speedKn: 0.5,
        dirDeg: 330,
        latMin: -35, latMax: -10,
        lonMin: -15, lonMax: 15
      },

      // Pacific
      {
        name: "North Equatorial Current (Pac)",
        basin: "Pacific",
        speedKn: 0.8,
        dirDeg: 270,
        latMin: 5, latMax: 18,
        lonMin: 140, lonMax: -80
      },
      {
        name: "South Equatorial Current (Pac)",
        basin: "Pacific",
        speedKn: 0.7,
        dirDeg: 270,
        latMin: -20, latMax: 0,
        lonMin: 150, lonMax: -80
      },
      {
        name: "Equatorial Countercurrent (Pac)",
        basin: "Pacific",
        speedKn: 0.6,
        dirDeg: 90,
        latMin: -3, latMax: 5,
        lonMin: 150, lonMax: -80
      },
      {
        name: "Kuroshio Current",
        basin: "Pacific",
        speedKn: 1.5,
        dirDeg: 45,
        latMin: 15, latMax: 35,
        lonMin: 120, lonMax: 170
      },
      {
        name: "California Current",
        basin: "Pacific",
        speedKn: 0.4,
        dirDeg: 135,
        latMin: 45, latMax: 20,
        lonMin: -140, lonMax: -115
      },
      {
        name: "East Australian Current",
        basin: "Pacific",
        speedKn: 0.8,
        dirDeg: 225,
        latMin: -15, latMax: -40,
        lonMin: 145, lonMax: 170
      },
      {
        name: "Humboldt (Peru) Current",
        basin: "Pacific",
        speedKn: 0.5,
        dirDeg: 330,
        latMin: -45, latMax: 0,
        lonMin: -90, lonMax: -70
      },

      // Indian
      {
        name: "South Equatorial Current (Ind)",
        basin: "Indian",
        speedKn: 0.6,
        dirDeg: 270,
        latMin: -20, latMax: 0,
        lonMin: 40, lonMax: 110
      },
      {
        name: "Agulhas Current",
        basin: "Indian",
        speedKn: 1.5,
        dirDeg: 225,
        latMin: -35, latMax: -15,
        lonMin: 32, lonMax: 45
      },
      {
        name: "West Australian Current",
        basin: "Indian",
        speedKn: 0.4,
        dirDeg: 315,
        latMin: -40, latMax: -20,
        lonMin: 110, lonMax: 125
      }
    ];

    function normalizeLonStd(lon) {
      let x = lon;
      while (x < -180) x += 360;
      while (x > 180) x -= 360;
      return x;
    }

    function getStandardCurrentAt(lat, lon) {
      const nLon = normalizeLonStd(lon);
      let best = null;
      for (const c of standardCurrents) {
        const lonMin = normalizeLonStd(c.lonMin);
        const lonMax = normalizeLonStd(c.lonMax);
        let inLon;
        if (lonMin <= lonMax) {
          inLon = nLon >= lonMin && nLon <= lonMax;
        } else {
          inLon = nLon >= lonMin || nLon <= lonMax;
        }
        if (lat >= c.latMin && lat <= c.latMax && inLon) {
          best = c;
          break;
        }
      }
      if (!best) return { name: "-", speedKn: null, dirDeg: null };
      return { name: best.name, speedKn: best.speedKn, dirDeg: best.dirDeg };
    }

    map.on("mousemove",e=>{
      const lat=e.latlng.lat.toFixed(2);
      const lon=wrapLon180(e.latlng.lng).toFixed(2);
      cursorLatLon.textContent=`${lat}, ${lon}`;
    });
    map.on("mouseout",()=>{ cursorLatLon.textContent="–"; });

    function addSingleMarker(lat,lon){
      if(lastMarker) map.removeLayer(lastMarker);
      lastMarker=L.marker([lat,lon]).addTo(map);
    }

    function addWaypoint(lat,lon){
      const m=L.marker([lat,lon]).addTo(map);
      markers.push({lat,lon,marker:m});
      legSpeeds.push(null);
      legTrackTypes.push("rl");
      if(markers.length>50){
        const old=markers.shift();
        legSpeeds.shift();
        legTrackTypes.shift();
        map.removeLayer(old.marker);
      }
      redrawRoute(); updateRouteTable();
    }

    function clearWaypoints(){
      markers.forEach(m=>map.removeLayer(m.marker));
      markers=[]; legSpeeds=[]; legTrackTypes=[];
      legLines.forEach(l=>map.removeLayer(l));
      legLines=[];
      routeTableBody.innerHTML="";
    }

    function gcDistanceNm(lat1, lon1, lat2, lon2){
      const R = 6371e3;
      const φ1=toRad(lat1), φ2=toRad(lat2);
      let λ1=toRad(lon1), λ2=toRad(lon2);
      let dλ = λ2 - λ1;
      if (Math.abs(dλ) > Math.PI) {
        dλ = dλ > 0 ? dλ - 2*Math.PI : dλ + 2*Math.PI;
        λ2 = λ1 + dλ;
      }
      const dφ = φ2 - φ1;
      const a = Math.sin(dφ/2)**2 +
                Math.cos(φ1)*Math.cos(φ2)*Math.sin(dλ/2)**2;
      const c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
      return (R*c)/1852;
    }

    function rlDistanceNm(lat1, lon1, lat2, lon2){
      const R=6371e3;
      const φ1=toRad(lat1), φ2=toRad(lat2);
      let dφ=φ2-φ1;
      let dλ=toRad(lon2-lon1);
      if(Math.abs(dλ)>Math.PI) dλ = dλ>0 ? -(2*Math.PI-dλ):(2*Math.PI+dλ);
      const dψ=Math.log(Math.tan(φ2/2+Math.PI/4)/Math.tan(φ1/2+Math.PI/4));
      const q=Math.abs(dψ)>1e-12 ? dφ/dψ : Math.cos(φ1);
      const dist=Math.sqrt(dφ*dφ+q*q*dλ*dλ)*R;
      return dist/1852;
    }

    function gcCourseDeg(lat1, lon1, lat2, lon2) {
      const φ1 = toRad(lat1);
      const φ2 = toRad(lat2);
      const Δλ = toRad(lon2 - lon1);
      const y = Math.sin(Δλ) * Math.cos(φ2);
      const x = Math.cos(φ1) * Math.sin(φ2) -
                Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
      let brng = Math.atan2(y, x);
      brng = (toDeg(brng) + 360) % 360;
      return brng;
    }

    function rlCourseDeg(lat1, lon1, lat2, lon2) {
      const φ1 = toRad(lat1);
      const φ2 = toRad(lat2);
      const Δλ = toRad(lon2 - lon1);
      const Δψ = Math.log(Math.tan(φ2 / 2 + Math.PI / 4) /
                          Math.tan(φ1 / 2 + Math.PI / 4));
      const q = Math.abs(Δψ) > 1e-12 ? (φ2 - φ1) / Δψ : Math.cos(φ1);
      let brng = Math.atan2(Δλ, Δψ || (φ2 - φ1));
      brng = (toDeg(brng) + 360) % 360;
      return brng;
    }

    function unwrapLon(lon1, lon2){
      let d = lon2 - lon1;
      if (d > 180) lon2 -= 360;
      else if (d < -180) lon2 += 360;
      return lon2;
    }

    function gcSegmentPoints(lat1, lon1, lat2, lon2, segments = 128) {
      const φ1 = toRad(lat1), λ1 = toRad(lon1);
      const φ2 = toRad(lat2), λ2 = toRad(lon2);
      const d = 2 * Math.asin(Math.sqrt(
        Math.sin((φ2 - φ1) / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2
      ));
      if (d === 0) return [[lat1, lon1]];
      const pts = [];
      for (let i = 0; i <= segments; i++) {
        const f = i / segments;
        const A = Math.sin((1 - f) * d) / Math.sin(d);
        const B = Math.sin(f * d) / Math.sin(d);
        const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
        const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
        const z = A * Math.sin(φ1) + B * Math.sin(φ2);
        const φi = Math.atan2(z, Math.sqrt(x * x + y * y));
        const λi = Math.atan2(y, x);
        pts.push([toDeg(φi), toDeg(λi)]);
      }
      return pts;
    }

    function redrawRoute(){
      legLines.forEach(l => map.removeLayer(l));
      legLines = [];
      if(!markers.length) return;
      if(markers.length===1){
        const line=L.polyline([[markers[0].lat,markers[0].lon]],{
          color:"#38bdf8",weight:3,opacity:0.9
        }).addTo(map);
        legLines.push(line);
        return;
      }
      const wp = markers.map(p => ({ lat: p.lat, lon: p.lon }));
      for (let i = 1; i < wp.length; i++) {
        wp[i].lon = unwrapLon(wp[i - 1].lon, wp[i].lon);
      }
      for (let i = 0; i < wp.length - 1; i++) {
        const a = wp[i];
        const b = wp[i + 1];
        const track = legTrackTypes[i + 1] || "rl";
        let pts;
        if (track === "gc") {
          pts = gcSegmentPoints(a.lat, a.lon, b.lat, b.lon, 128);
        } else {
          pts = [[a.lat, a.lon], [b.lat, b.lon]];
        }
        const line = L.polyline(pts, {
          color: track === "gc" ? "#fbbf24" : "#38bdf8",
          weight: 3,
          opacity: 0.9
        }).addTo(map);
        legLines.push(line);
      }
    }

    enableWaypointsTop.addEventListener("change",()=>{
      if(enableWaypointsTop.checked) routeDetailsDiv.style.display="block";
      else{ routeDetailsDiv.style.display="none"; clearWaypoints(); }
    });

    map.on("click",e=>{
      const {lat,lng}=e.latlng;
      if(enableWaypointsTop.checked){ addWaypoint(lat,lng); fetchWeatherAndForecast(lat,lng); }
      else{ addSingleMarker(lat,lng); fetchWeatherAndForecast(lat,lng); }
    });

    closePanel.onclick = () => weatherPanel.classList.remove("active");
    if(window.innerWidth<=600 && routeToggleMobile)
      routeToggleMobile.style.display="inline-block";
    routeToggleMobile?.addEventListener("click",()=>{
      const collapsed=document.body.classList.toggle("route-collapsed");
      routeToggleMobile.textContent=collapsed?"Expand":"Collapse";
    });

    function getMarineAtTime(targetTimeMs){
      if(!lastMarineForecast || !lastMarineForecast.hourly ||
         !Array.isArray(lastMarineForecast.hourly.time))
        return {
          waveheight:null,
          swell_wave_height:null,
          wind_wave_height:null,
          wave_direction:null,
          swell_wave_direction:null,
          wind_wave_direction:null
        };
      const times=lastMarineForecast.hourly.time;
      const h=lastMarineForecast.hourly;
      const wh=h.wave_height||[], swh=h.swell_wave_height||[], wwh=h.wind_wave_height||[];
      const wd=h.wave_direction||[], swd=h.swell_wave_direction||[], wwd=h.wind_wave_direction||[];
      let bestIdx=-1,bestDiff=Infinity;
      for(let i=0;i<times.length;i++){
        const tMs=Date.parse(times[i]); const diff=Math.abs(tMs-targetTimeMs);
        if(diff<bestDiff){bestDiff=diff;bestIdx=i;}
      }
      if(bestIdx===-1) return {
        waveheight:null,
        swell_wave_height:null,
        wind_wave_height:null,
        wave_direction:null,
        swell_wave_direction:null,
        wind_wave_direction:null
      };
      return {
        waveheight:wh[bestIdx]!=null?wh[bestIdx]:null,
        swell_wave_height:swh[bestIdx]!=null?swh[bestIdx]:null,
        wind_wave_height:wwh[bestIdx]!=null?wwh[bestIdx]:null,
        wave_direction:wd[bestIdx]!=null?wd[bestIdx]:null,
        swell_wave_direction:swd[bestIdx]!=null?swd[bestIdx]:null,
        wind_wave_direction:wwd[bestIdx]!=null?wwd[bestIdx]:null
      };
    }

    function getForecastAtTime(targetTimeMs){
      if(!lastForecastData || !Array.isArray(lastForecastData.list)) return null;
      let best=null,bestDiff=Infinity;
      for(const entry of lastForecastData.list){
        const tMs=entry.dt*1000, diff=Math.abs(tMs-targetTimeMs);
        if(diff<bestDiff){bestDiff=diff;best=entry;}
      }
      return best;
    }

    function showWeatherPanel(data,lat,lon,marine){
      const name=data && data.name;
      const weather=data && data.weather && data.weather[0];
      let icon="";
      if(weather && weather.icon)
        icon=`<img src="https://openweathermap.org/img/wn/${weather.icon}@2x.png"
                     style="width:40px;height:40px;vertical-align:middle;"> `;
      const desc=weather && weather.description || "";
      const temp=data?.main?.temp!==undefined?Math.round(data.main.temp)+" °C":"-";
      const wind=data?.wind?.speed!==undefined?(data.wind.speed*1.943844).toFixed(1)+" kt":"-";
      const hum=data?.main?.humidity!==undefined?data.main.humidity+" %":"-";
      const pres=data?.main?.pressure!==undefined?data.main.pressure+" mb":"-";

      const windDeg = data?.wind?.deg;
      let windDirText = "-";
      let windArrowHtml = "";
      if (typeof windDeg === "number") {
        const wd = Math.round(windDeg);
        windDirText = wd + "°";
        windArrowHtml =
          `<span class="wave-dir-arrow" style="transform:rotate(${wd}deg);"></span>`;
      }

      let coordsInfo="";
      if(lat!==undefined && lon!==undefined)
        coordsInfo=`<div style="font-size:.82em;opacity:.78;">${lat.toFixed(4)}, ${lon.toFixed(4)}</div>`;

      let totalWave="-",swellWave="-",windWave="-",hasWaves=false;
      let totalDir="-", swellDir="-", windWaveDir="-";

      if(marine && marine.hourly){
        const h=marine.hourly;
        if(Array.isArray(h.wave_height) && h.wave_height[0]!=null){
          totalWave=h.wave_height[0].toFixed(1)+" m"; hasWaves=true;
        }
        if(Array.isArray(h.swell_wave_height) && h.swell_wave_height[0]!=null){
          swellWave=h.swell_wave_height[0].toFixed(1)+" m"; hasWaves=true;
        }
        if(Array.isArray(h.wind_wave_height) && h.wind_wave_height[0]!=null){
          windWave=h.wind_wave_height[0].toFixed(1)+" m"; hasWaves=true;
        }
        if(Array.isArray(h.wave_direction) && h.wave_direction[0]!=null){
          totalDir=Math.round(h.wave_direction[0])+"°";
        }
        if(Array.isArray(h.swell_wave_direction) && h.swell_wave_direction[0]!=null){
          swellDir=Math.round(h.swell_wave_direction[0])+"°";
        }
        if(Array.isArray(h.wind_wave_direction) && h.wind_wave_direction[0]!=null){
          windWaveDir=Math.round(h.wind_wave_direction[0])+"°";
        }
      }
      let waveHtml="";
      if(hasWaves){
        const totalDegNum = totalDir !== "-" ? parseInt(totalDir) : null;
        const swellDegNum = swellDir !== "-" ? parseInt(swellDir) : null;
        const windWaveDegNum = windWaveDir !== "-" ? parseInt(windWaveDir) : null;

        const totalArrow = totalDegNum != null
          ? `<span class="wave-dir-arrow" style="transform:rotate(${totalDegNum}deg);"></span>` : "";
        const swellArrow = swellDegNum != null
          ? `<span class="wave-dir-arrow" style="transform:rotate(${swellDegNum}deg);"></span>` : "";
        const windWaveArrow = windWaveDegNum != null
          ? `<span class="wave-dir-arrow" style="transform:rotate(${windWaveDegNum}deg);"></span>` : "";

        waveHtml=`
          <hr style="border:none;border-top:1px solid #0003;margin:6px 0;">
          <div style="font-weight:bold;margin-bottom:3px;">Wave snapshot</div>
          <div>Total waves: <b>${totalWave}</b> (dir <b>${totalDir}</b>${totalArrow})</div>
          <div>Swell height: <b>${swellWave}</b> (dir <b>${swellDir}</b>${swellArrow})</div>
          <div>Wind wave height: <b>${windWave}</b> (dir <b>${windWaveDir}</b>${windWaveArrow})</div>`;
      }

      // --- Standard surface current at clicked location ---
      const stdCurrent = getStandardCurrentAt(lat, lon);
      let currentHtml = "";
      if (stdCurrent.speedKn != null && stdCurrent.dirDeg != null) {
        const d = Math.round(stdCurrent.dirDeg);
        const arrow =
          `<span class="wave-dir-arrow" style="transform:rotate(${d}deg);"></span>`;
        currentHtml =
          `<hr style="border:none;border-top:1px solid #0003;margin:6px 0;">` +
          `<div style="font-weight:bold;margin-bottom:3px;">Standard surface current</div>` +
          `<div>${stdCurrent.name}</div>` +
          `<div>Speed <b>${stdCurrent.speedKn.toFixed(1)} kn</b> dir <b>${d}°</b> ${arrow}</div>`;
      }

      panelContent.innerHTML=`
        <b style="font-size:1.05em;">${icon}${name || "Lat/Lon"}${coordsInfo}</b>
        <div>${desc}</div>
        <div>Temp: <b>${temp}</b></div>
        <div>Humidity: <b>${hum}</b></div>
        <div>Wind: <b>${wind}</b> (dir <b>${windDirText}</b>${windArrowHtml})</div>
        <div>Pressure: <b>${pres}</b></div>
        ${waveHtml}
        ${currentHtml}`;
      weatherPanel.classList.add("active");
    }

    function renderForecastBar(){
      forecastItems.innerHTML="";
      if(!lastForecastData || !Array.isArray(lastForecastData.list)) return;
      forecastBar.style.display="block";
      toggleForecastBtn.textContent="Hide forecast";

      const stepHours=parseInt(forecastStepSelect.value,10);
      const list=lastForecastData.list;
      const baseStep=3;
      const indicesStep=Math.max(1,Math.round(stepHours/baseStep));
      for(let i=0;i<list.length;i+=indicesStep){
        const entry=list[i];
        const dtMs=entry.dt*1000, d=new Date(dtMs);
        const hour=d.getUTCHours().toString().padStart(2,"0");
        const day=d.getUTCDate().toString().padStart(2,"0");
        const month=(d.getUTCMonth()+1).toString().padStart(2,"0");

        const temp=entry.main?.temp!==undefined?Math.round(entry.main.temp)+" °C":"-";
        let wind="-";
        if(entry.wind?.speed!==undefined){
          const wms=entry.wind.speed, wkn=wms*1.943844;
          wind=wkn.toFixed(1)+" kt";
        }
        const hum=entry.main?.humidity!==undefined?entry.main.humidity+" %":"-";
        const pres=entry.main?.pressure!==undefined?entry.main.pressure+" mb":"-";

        const rain=entry.rain?.["3h"]!==undefined?entry.rain["3h"]:0;
        const snow=entry.snow?.["3h"]!==undefined?entry.snow["3h"]:0;
        const precipTotal=rain+snow;
        const precipText=precipTotal>0?precipTotal.toFixed(1)+" mm":"0 mm";

        const weather=entry.weather && entry.weather[0];
        const desc=weather?.description || "";
        const iconCode=weather?.icon;
        const iconUrl=iconCode?`https://openweathermap.org/img/wn/${iconCode}.png`:"";

        const marine=getMarineAtTime(dtMs);
        let swell="-", windWave="-";
        if(marine?.swell_wave_height!=null){
          const mVal=marine.swell_wave_height, ftVal=mVal*3.28084;
          swell=`${mVal.toFixed(1)} m / ${ftVal.toFixed(1)} ft`;
        }
        if(marine?.wind_wave_height!=null){
          const mVal=marine.wind_wave_height, ftVal=mVal*3.28084;
          windWave=`${mVal.toFixed(1)} m / ${ftVal.toFixed(1)} ft`;
        }

        const item=document.createElement("div");
        item.className="forecast-item";
        item.innerHTML=`
          <div class="forecast-item-time">${day}/${month} ${hour}:00Z</div>
          <div class="forecast-item-temp">${temp}</div>
          <div class="forecast-item-line">
            ${iconUrl?`<img src="${iconUrl}" alt="" class="forecast-item-icon">`:""}
            <span>${desc}</span>
          </div>
          <div class="forecast-item-line">Wind: ${wind}</div>
          <div class="forecast-item-line">Hum: ${hum}</div>
          <div class="forecast-item-line">Press: ${pres}</div>
          <div class="forecast-item-line">Precip: ${precipText}</div>
          <div class="forecast-item-line">Swell: ${swell}</div>
          <div class="forecast-item-line">Wind wave: ${windWave}</div>`;
        forecastItems.appendChild(item);
      }
    }

    forecastStepSelect.addEventListener("change",renderForecastBar);
    function toggleForecast(){
      if(!forecastBar.style.display || forecastBar.style.display==="none"){
        if(lastForecastData && Array.isArray(lastForecastData.list)){
          forecastBar.style.display="block";
          toggleForecastBtn.textContent="Hide forecast";
        }
      }else{
        forecastBar.style.display="none";
        toggleForecastBtn.textContent="Show forecast";
      }
    }
    toggleForecastBtn.onclick=toggleForecast;
    hideForecastBtn.onclick=toggleForecast;

    function updateRouteTable(){
      routeTableBody.innerHTML="";
      if(!markers.length || !lastForecastData || !Array.isArray(lastForecastData.list)) return;

      const globalSpeed=parseFloat(vesselSpeedInput.value)||0;
      const depStr=departureUtcInput.value;
      if(!globalSpeed || !depStr) return;

      const depTime=new Date(depStr+"Z");
      let cumulativeHours=0, compositeTotalNm=0;
      let swellSum=0,swellCount=0,windWaveSum=0,windWaveCount=0;

      markers.forEach((m,i)=>{
        let distGc=0, distRl=0;
        if(i>0){
          const prev=markers[i-1];
          distGc=gcDistanceNm(prev.lat,prev.lon,m.lat,m.lon);
          distRl=rlDistanceNm(prev.lat,prev.lon,m.lat,m.lon);
        }

        let legTrack = legTrackTypes[i];
        if (!legTrack) { legTrack="rl"; legTrackTypes[i]="rl"; }

        let legSpeed = legSpeeds[i];
        if (legSpeed == null || legSpeed <= 0) legSpeed = globalSpeed;

        const activeDist = (i>0 ? (legTrack==="gc"?distGc:distRl) : 0);
        const hoursSeg = (i>0 && legSpeed) ? (activeDist/legSpeed) : 0;
        cumulativeHours += hoursSeg;
        compositeTotalNm += activeDist;

        const etaMs=depTime.getTime()+cumulativeHours*3600*1000;
        const eta=new Date(etaMs);
        const etaStr=`${eta.getUTCDate().toString().padStart(2,"0")}.${
          (eta.getUTCMonth()+1).toString().padStart(2,"0")}.${eta.getFullYear()} ${
          eta.getUTCHours().toString().padStart(2,"0")}:${
          eta.getUTCMinutes().toString().padStart(2,"0")}Z`;

        const fcEntry=getForecastAtTime(etaMs);
        let temp="",wind="",pres="",hum="",desc="",swell="",windWave="";
        let curSpeedText="",curDirText="";
        let swellDirText="", windWaveDirText="";
        let windDirText="", windArrowHtml="";

        if(fcEntry){
          if(fcEntry.main){
            if(fcEntry.main.temp!==undefined) temp=Math.round(fcEntry.main.temp)+" °C";
            if(fcEntry.main.humidity!==undefined) hum=fcEntry.main.humidity+" %";
            if(fcEntry.main.pressure!==undefined) pres=fcEntry.main.pressure+" mb";
          }
          if(fcEntry.wind?.speed!==undefined){
            const wms=fcEntry.wind.speed, wkn=wms*1.943844;
            wind=wkn.toFixed(1)+" kt";
          }
          if(typeof fcEntry.wind?.deg === "number"){
            const d = Math.round(fcEntry.wind.deg);
            windDirText = d + "°";
            windArrowHtml =
              `<span class="wave-dir-arrow" style="transform:rotate(${d}deg);"></span>`;
          }
          if(fcEntry.weather && fcEntry.weather[0]) desc=fcEntry.weather[0].description||"";
        }

        const marine=getMarineAtTime(etaMs);
        if(marine?.swell_wave_height!=null){
          const mv=marine.swell_wave_height, ft=mv*3.28084;
          swell=`${mv.toFixed(1)} m / ${ft.toFixed(1)} ft`;
          swellSum+=mv; swellCount++;
        }
        if(marine?.wind_wave_height!=null){
          const mv=marine.wind_wave_height, ft=mv*3.28084;
          windWave=`${mv.toFixed(1)} m / ${ft.toFixed(1)} ft`;
          windWaveSum+=mv; windWaveCount++;
        }
        if(marine?.swell_wave_direction!=null){
          swellDirText = Math.round(marine.swell_wave_direction) + "°";
        }
        if(marine?.wind_wave_direction!=null){
          windWaveDirText = Math.round(marine.wind_wave_direction) + "°";
        }

        // --- Standard surface current at waypoint ---
        const stdCur = getStandardCurrentAt(m.lat, m.lon);
        if (stdCur.speedKn != null && stdCur.dirDeg != null) {
          curSpeedText = stdCur.speedKn.toFixed(1) + " kn";
          curDirText = Math.round(stdCur.dirDeg) + "°";
        }

        let finalCrsDeg = 0;
        if (i > 0) {
          const prev = markers[i - 1];
          if (legTrack === "gc") {
            finalCrsDeg = gcCourseDeg(prev.lat, prev.lon, m.lat, m.lon);
          } else {
            finalCrsDeg = rlCourseDeg(prev.lat, prev.lon, m.lat, m.lon);
          }
        }

        const tr=document.createElement("tr");
        tr.innerHTML=`
          <td>${i+1}</td>
          <td><input class="wp-lat-input" data-index="${i}" value="${m.lat.toFixed(3)}" style="width:70px;"></td>
          <td><input class="wp-lon-input" data-index="${i}" value="${m.lon.toFixed(3)}" style="width:80px;"></td>
          <td>
            <select class="wp-track-select" data-index="${i}" style="width:70px;">
              <option value="gc"${legTrack==="gc"?" selected":""}>GC</option>
              <option value="rl"${legTrack==="rl"?" selected":""}>RL</option>
            </select>
          </td>
          <td>${i === 0 ? "" : finalCrsDeg.toFixed(0)}°</td>
          <td>${activeDist.toFixed(1)}</td>
          <td><input class="wp-speed-input" data-index="${i}" value="${legSpeed.toFixed(1)}" style="width:70px;"></td>
          <td>${etaStr}</td>
          <td>${temp}</td>
          <td>
            ${wind}
            ${windDirText ? ` (dir ${windDirText})` : ""}
            ${windArrowHtml || ""}
          </td>
          <td>${pres}</td>
          <td>${hum}</td>
          <td>${desc}</td>
          <td>${swell}</td>
          <td>${windWave}</td>
          <td>
            ${swellDirText}
            ${swellDirText
              ? `<span class="wave-dir-arrow" style="transform:rotate(${parseInt(swellDirText)}deg);"></span>`
              : ""}
          </td>
          <td>
            ${windWaveDirText}
            ${windWaveDirText
              ? `<span class="wave-dir-arrow" style="transform:rotate(${parseInt(windWaveDirText)}deg);"></span>`
              : ""}
          </td>
          <td>${curSpeedText}</td>
          <td>${curDirText}</td>`;
        routeTableBody.appendChild(tr);
      });

      const avgSwellM=swellCount?swellSum/swellCount:0;
      const avgWindWaveM=windWaveCount?windWaveSum/windWaveCount:0;
      const avgSwell=swellCount
        ?`${avgSwellM.toFixed(1)} m / ${(avgSwellM*3.28084).toFixed(1)} ft`:"-";
      const avgWindWave=windWaveCount
        ?`${avgWindWaveM.toFixed(1)} m / ${(avgWindWaveM*3.28084).toFixed(1)} ft`:"-";

      const avgSpeed = (compositeTotalNm>0 && cumulativeHours>0) ? (compositeTotalNm / cumulativeHours) : 0;

      const totalRow=document.createElement("tr");
      totalRow.style.fontWeight="600";
      totalRow.innerHTML=`
        <td colspan="3" style="text-align:right;">Total dist</td>
        <td></td>
        <td></td>
        <td>${compositeTotalNm.toFixed(1)}</td>
        <td>${avgSpeed ? avgSpeed.toFixed(1) + " kt avg" : "-"}</td>
        <td></td>
        <td colspan="2" style="text-align:right;">Avg swell</td>
        <td colspan="2">${avgSwell}</td>
        <td style="text-align:right;">Avg wind wave</td>
        <td colspan="2">${avgWindWave}</td>
        <td colspan="2"></td>`;
      routeTableBody.appendChild(totalRow);
    }

    departureGoBtn.addEventListener("click",updateRouteTable);
    routeResetBtn.addEventListener("click",clearWaypoints);
    routeExpandBtn.addEventListener("click",()=>{
      consoleExpanded=!consoleExpanded;
      if(consoleExpanded){
        routeDetailsDiv.style.maxHeight="60vh";
        routeExpandBtn.textContent="Collapse";
      } else {
        routeDetailsDiv.style.maxHeight="110px";
        routeExpandBtn.textContent="Expand";
      }
    });

    routeTableBody.addEventListener("change",e=>{
      const t=e.target;

      if(t.classList.contains("wp-speed-input")){
        const idx=parseInt(t.dataset.index,10);
        if(!isNaN(idx)){
          const v=parseFloat(t.value);
          legSpeeds[idx]=isNaN(v)?null:v;
          updateRouteTable(); redrawRoute();
        }
        return;
      }

      if(t.classList.contains("wp-track-select")){
        const idx=parseInt(t.dataset.index,10);
        if(!isNaN(idx)){
          const v=t.value==="rl"?"rl":"gc";
          legTrackTypes[idx]=v;
          updateRouteTable(); redrawRoute();
        }
        return;
      }

      if(!t.classList.contains("wp-lat-input") && !t.classList.contains("wp-lon-input")) return;
      const idx=parseInt(t.dataset.index,10);
      if(isNaN(idx) || !markers[idx]) return;
      const row=t.closest("tr");
      const latInput=row.querySelector(".wp-lat-input");
      const lonInput=row.querySelector(".wp-lon-input");
      const newLat=parseFloat(latInput.value);
      const newLon=parseFloat(lonInput.value);
      if(isNaN(newLat) || isNaN(newLon)) return;
      markers[idx].lat=newLat; markers[idx].lon=newLon;
      markers[idx].marker.setLatLng([newLat,newLon]);
      redrawRoute(); updateRouteTable();
    });

    downloadPdfBtn.addEventListener("click", () => {
      if (!routeTableBody.rows.length) {
        alert("No route data to export.");
        return;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");

      const img = new Image();
      img.crossOrigin = "Anonymous";

      img.onload = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 0.10;

        const logoW = 220;
        const logoH = 220;
        const logoX = 40;
        const logoY = (canvas.height - logoH) / 2;
        ctx.drawImage(img, logoX, logoY, logoW, logoH);

        ctx.font = "bold 52px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillStyle = "#0b5fad";
        ctx.fillText("Nav", logoX + logoW + 30, logoY + 110);

        ctx.font = "bold 52px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("Force", logoX + logoW + 30, logoY + 170);

        ctx.globalAlpha = 1.0;

        const canvasDataUrl = canvas.toDataURL("image/png");
        doc.addImage(canvasDataUrl, "PNG", 40, 40, 220, 110);

        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.text("NavForce Route Console Report", 20, 20);

        doc.setFontSize(9);
        doc.setFont(undefined, "normal");
        const now = new Date();
        doc.text("Generated " + now.toUTCString(), 20, 28);

        const table = routeTableBody.closest("table");
        const headCells = Array.from(table.querySelectorAll("thead tr th"))
          .map(th => th.textContent.trim());
        const bodyRows = [];
        Array.from(routeTableBody.querySelectorAll("tr")).forEach(tr => {
          const cells = Array.from(tr.children).map(td => {
            const input = td.querySelector("input,select");
            if (input) {
              if (input.tagName === "SELECT") {
                const sel = input;
                return sel.options[sel.selectedIndex]?.text || sel.value || "";
              }
              return input.value;
            }
            return td.textContent.trim();
          });
          bodyRows.push(cells);
        });

        doc.autoTable({
          head: [headCells],
          body: bodyRows,
          startY: 35,
          theme: "grid",
          styles: { fontSize: 7, cellPadding: 2, textColor: [0,0,0] },
          headStyles: { fillColor: [15,23,42], textColor: [255,255,255], fontStyle: "bold" },
          margin: { left: 10, right: 10 },
          didDrawPage: function (data) {
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.getHeight();
            doc.setFontSize(7);
            doc.text(
              "Page " + data.pageNumber,
              pageSize.getWidth() / 2,
              pageHeight - 5,
              { align: "center" }
            );
          }
        });

        doc.save("route-console.pdf");
      };

      img.onerror = function () {
        exportPdfWithoutWatermark();
      };

      img.src = "https://agi-prod-file-upload-public-main-use1.s3.amazonaws.com/d2cae29d-bcd6-4e50-afa8-5130c39b17b2";

      function exportPdfWithoutWatermark() {
        const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.text("Route Console Report", 20, 20);

        doc.setFontSize(9);
        doc.setFont(undefined, "normal");
        const now = new Date();
        doc.text("Generated " + now.toUTCString(), 20, 28);

        const table = routeTableBody.closest("table");
        const headCells = Array.from(table.querySelectorAll("thead tr th"))
          .map(th => th.textContent.trim());
        const bodyRows = [];
        Array.from(routeTableBody.querySelectorAll("tr")).forEach(tr => {
          const cells = Array.from(tr.children).map(td => {
            const input = td.querySelector("input,select");
            if (input) {
              if (input.tagName === "SELECT") {
                const sel = input;
                return sel.options[sel.selectedIndex]?.text || sel.value || "";
              }
              return input.value;
            }
            return td.textContent.trim();
          });
          bodyRows.push(cells);
        });

        doc.autoTable({
          head: [headCells],
          body: bodyRows,
          startY: 35,
          theme: "grid",
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [15,23,42], textColor: [255,255,255] },
          margin: { left: 10, right: 10 }
        });

        doc.save("route-console.pdf");
      }
    });

    async function fetchWeatherAndForecast(lat,lon){
      try{
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apikey}&units=metric`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apikey}&units=metric`;
        const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,swell_wave_height,wind_wave_height,wave_direction,swell_wave_direction,wind_wave_direction&length=120&timezone=UTC`;

        const [weatherRes,forecastRes,marineRes] = await Promise.all([
          fetch(weatherUrl),
          fetch(forecastUrl),
          fetch(marineUrl)
        ]);

        const weatherData = await weatherRes.json();
        lastForecastData = forecastRes.ok ? await forecastRes.json() : null;
        lastMarineForecast = marineRes.ok ? await marineRes.json() : null;

        showWeatherPanel(weatherData,lat,lon,lastMarineForecast);
        renderForecastBar();
        if(enableWaypointsTop.checked) updateRouteTable();
      }catch(err){
        alert("Error fetching weather data. Please try again.");
        console.error(err);
      }
    }

    placeGo.onclick = handlePlaceSearch;
    placeInput.addEventListener("keypress",e=>{
      if(e.key==="Enter"){
        e.preventDefault();
        handlePlaceSearch();
      }
    });

    async function handlePlaceSearch(){
      const place=placeInput.value.trim();
      if(!place) return;
      try{
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(place)}&appid=${apikey}&units=metric`;
        const res = await fetch(url);
        const data = await res.json();
        if(!res.ok || !data.coord){
          alert("Place not found or API error");
          return;
        }
        const lat=data.coord.lat, lon=data.coord.lon;
        map.setView([lat,lon],4);
        if(enableWaypointsTop.checked) addWaypoint(lat,lon);
        else addSingleMarker(lat,lon);
        await fetchWeatherAndForecast(lat,lon);
      }catch(err){
        alert("Error fetching place weather. Please try again.");
        console.error(err);
      }
    }

    latLonGo.onclick = handleLatLonSearch;
    async function handleLatLonSearch(){
      const latDeg = parseFloat(document.getElementById("latDegTop").value);
      const latMin = parseFloat(document.getElementById("latMinTop").value);
      const lonDeg = parseFloat(document.getElementById("lonDegTop").value);
      const lonMin = parseFloat(document.getElementById("lonMinTop").value);
      const latHem = document.getElementById("latHemTop").value;
      const lonHem = document.getElementById("lonHemTop").value;

      if (Number.isNaN(latDeg) || Number.isNaN(latMin) ||
          Number.isNaN(lonDeg) || Number.isNaN(lonMin)) {
        alert("Enter degrees and minutes for both latitude and longitude.");
        return;
      }

      let lat = latDeg + latMin/60;
      let lon = lonDeg + lonMin/60;
      if (latHem === "S") lat = -lat;
      if (lonHem === "W") lon = -lon;

      map.setView([lat,lon],4);
      if(enableWaypointsTop.checked) addWaypoint(lat,lon);
      else addSingleMarker(lat,lon);
      fetchWeatherAndForecast(lat,lon);
    }
  </script>