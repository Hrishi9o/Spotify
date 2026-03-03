  let songs=[];
  let currfolder;
  let songul1=document.querySelector(".songul");
  //time formatting function
function formatTime(currentTime, duration) {

    if (isNaN(duration)) {
        return "00:00/00:00";
    }

    let currentMinutes = Math.floor(currentTime / 60);
    let currentSeconds = Math.floor(currentTime % 60);

    let totalMinutes = Math.floor(duration / 60);
    let totalSeconds = Math.floor(duration % 60);

    if (currentSeconds < 10) currentSeconds = "0" + currentSeconds;
    if (totalSeconds < 10) totalSeconds = "0" + totalSeconds;
    if (currentMinutes < 10) currentMinutes = "0" + currentMinutes;
    if (totalMinutes < 10) totalMinutes = "0" + totalMinutes;

    return currentMinutes + ":" + currentSeconds + "/" +
           totalMinutes + ":" + totalSeconds;
}

//fetch songs
async function getsongs(folder){
    currfolder=folder
    let a =await fetch(`/Spotify/${folder}`);
    let response= await a.text();
    // console.log(response);
    let div=document.createElement("div");
    div.innerHTML=response;
    let as=div.getElementsByTagName("a")
    songs=[];
    songul1.innerHTML="";
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if(element.href.endsWith(".mp3")){
            songs.push(element.href);
        }
    }
    // console.log(songs)
    for (const song of songs) {
        // var element=song.split("-")[1];
        songul1.innerHTML=songul1.innerHTML+`<li>
                            <img src="music.svg" alt="">
                            <div class="info">
                                <div>${song.split(`%5C`)[3]}</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img src="play.svg" alt="">
                            </div>
                        </li>`;
    }
    
    
    return songs;
}

//function to play music
let currentsong=new Audio();
const playmusic=(track,pause=false)=>{
    currentsong.src= track;
    if(!pause){
        currentsong.play();
        play.src="play.svg";
    }
    document.querySelector(".songinfo").innerHTML=track.split("%5C")[3];
    document.querySelector(".songtime").innerHTML="00:00/00:00";
}
//dynamic album
async function displayalbum(){
    let a =await fetch(`/bollywood`);
    let response= await a.text();
    let div=document.createElement("div");
    div.innerHTML=response;
    // console.log(div);
    let anchors=div.getElementsByTagName("a");
    // console.log(anchors)
    let array=Array.from(anchors);
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        // console.log(e.href)
        if(e.href.includes("%5Cbollywood")){
            let element=e.href.split(`%5C`)[2]
            let folder=element.split("/")[0];
            //gte the meta data of the folder
            // console.log(folder)
            let a =await fetch(`/bollywood/${folder}/info.json`);
            let response= await a.json();
            // console.log(response);
            let cardcontainer=document.querySelector(".cardcontainer")
            cardcontainer.innerHTML=cardcontainer.innerHTML+`<div class="card" data-folder="${folder}">
                        <div class="play">
                            <svg xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 100 100"
                                width="40px"
                                height="40px">
                            <circle cx="50" cy="50" r="48" fill="#2EE36A"/>
                            <polygon points="40,30 40,70 70,50"
                            fill="#000000"/>
                            </svg>
                        </div>
                        <img src="/bollywood/${folder}/cover.jpg" alt="">
                        <h3>${response.title}</h3>
                        <h4>${response.description}</h4>
                        </div>`   
        }
    }
    let cf;
    Array.from(document.getElementsByClassName("card")).forEach(e=>{//e is the card element
        e.addEventListener("click",async (item)=>{//item is the click object
            // console.log(item.currentTarget.dataset.folder)//currenttarget gives the card
            cf=item.currentTarget.dataset.folder;
            songs=await getsongs(`bollywood/${item.currentTarget.dataset.folder}`);
            playmusic(songs[0]);

            //adding event listner li of songul library on the left
            Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
                e.addEventListener("click", element => {
                    let ele=e.querySelector(".info").firstElementChild.innerHTML;
                    playmusic(`%5Cbollywood%5C${cf}%5C${ele}`)
                })
            })
        })
    })    
}
async function main() {
    //get list of all songs
    songs=await getsongs("bollywood/h2")
    playmusic(songs[0],true);
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
                e.addEventListener("click", element => {
                    let ele=e.querySelector(".info").firstElementChild.innerHTML;
                    playmusic(`%5Cbollywood%5Ch2%5C${ele}`)
                })
            })

    displayalbum();

    //addevent listner to the play button
    let play=document.getElementById("play");
    play.addEventListener("click",()=>{
        if(currentsong.paused){
            currentsong.play();
            play.src="play.svg";
        }
        else{
            currentsong.pause();
            play.src="pause.svg";
        }
    })

    //event listner for the play bar.
    currentsong.addEventListener("timeupdate",()=>{
        // console.log(currentsong.currentTime,currentsong.duration );
        document.querySelector(".songtime").innerHTML=`${formatTime(currentsong.currentTime,currentsong.duration)}`
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration)*100 + "%";

        if(currentsong.currentTime==currentsong.duration){//automatic nextplay
            let index = songs.indexOf(currentsong.src);
            console.log(index)
            if(index+1 < songs.length){
            let element=songs[index+1];
            console.log(element)
            playmusic(element);
        }
    }
    })
    
    //adding event listmer to the seekbar circle 
    document.querySelector(".seekbar").addEventListener("click",e=>{
        // console.log(e.offsetX);
        // console.log(e.target);
        // console.log(e.target.getBoundingClientRect(),e.offsetX);
        // console.log((e.offsetX/e.target.getBoundingClientRect().width)*100);
        let percent=(e.offsetX/e.target.getBoundingClientRect().width)
        document.querySelector(".circle").style.left=percent + "%";
        currentsong.currentTime=(currentsong.duration)*percent;
    })

    //hamburger
    document.querySelector(".hamburger").addEventListener("click",()=>{
        document.querySelector(".left").style.left="0%";
    })
    document.querySelector(".close").addEventListener("click",()=>{
        document.querySelector(".left").style.left="-120%";
    })

    //adding eventlistner for next and prev
    let next=document.getElementById("next");
    next.addEventListener("click",()=>{
    //    console.log(currentsong.src);
       let index = songs.indexOf(currentsong.src);
    //    console.log(index)
       if(index+1 < songs.length){
        let element=songs[index+1];
        console.log(element)
        playmusic(element);
       }
    })
    let prev=document.getElementById("previous");
    prev.addEventListener("click",()=>{
    //    console.log(currentsong.src);
       let index = songs.indexOf(currentsong.src);
    //    console.log(index)
       if((index-1) >= 0){
        let element=songs[index-1];
        console.log(element)
        playmusic(element);
       }
    })

    //adding event listner for volume
    document.querySelector(".range").firstElementChild.addEventListener("change",(e)=>{
        // console.log(e,e.target,e.target.value/100)
        currentsong.volume=(e.target.value)/100;
        if (currentsong.volume >0){
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg")
        }
        if (currentsong.volume==0){
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("volume.svg", "mute.svg")
        }
    })
    //mute
    document.querySelector(".volume>img").addEventListener("click",(e)=>{
        // console.log(e.target);
        if(e.target.src.includes("volume.svg")){
          e.target.src=e.target.src.replace("volume.svg","mute.svg")
          currentsong.volume=0;  
          document.querySelector(".range").firstElementChild.value=0;
        }
        else{
           e.target.src=e.target.src.replace("mute.svg","volume.svg")
           currentsong.volume=0.5; 
           document.querySelector(".range").firstElementChild.value=50;
        }
    })
   
}
main()


