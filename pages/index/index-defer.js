import "../../components/MediaCarousel/index.js";

// When the user scrolls down 10px from the top of the document, show the backgroud
const app_nav = document.querySelector("#app_nav");
function changeLinkState() {
    if (window.scrollY > 10) {
        app_nav.classList.add("bg-primary");
    } else {
        app_nav.classList.remove("bg-primary");
    }
}
app_nav.classList.remove("bg-primary");
window.addEventListener("scroll", changeLinkState);
