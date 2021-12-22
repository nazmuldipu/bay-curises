import "../../components/MediaCarousel/index.js";

// When the user scrolls down 10px from the top of the document, show the backgroud
const app_nav = document.querySelector("#app_nav");
function changeLinkState() {
    console.log(screen.width);
    if (window.scrollY > 10) {
        app_nav.classList.add("bg-primary");
    } else {
        app_nav.classList.remove("bg-primary");
    }
}
if (screen.width > 768) {
    app_nav.classList.remove("bg-primary");
    window.addEventListener("scroll", changeLinkState);
}