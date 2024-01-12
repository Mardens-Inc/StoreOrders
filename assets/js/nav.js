$("window").ready(() => {
    navigate(window.location.pathname+window.location.search);
});

$("[page]").on("click", (e) => {
    navigate(e.target.getAttribute("page"));
});

function getPageFile() {
    return `/pages/${window.location.pathname == "/" ? "home" : window.location.pathname}.php${window.location.search}`;
}

function navigate(page) {
    $(`.nav-item[active]`).removeAttr("active");
    $(`.nav-item[page="${page}"]`).attr("active", "");
    window.history.replaceState({}, page, page);
    loadPage();
}

function loadPage() {
    $.ajax({
        url: getPageFile(),
        success: (data) => {
            $("main").html(data);
            $("main").trigger("page-load");
        },
        error: () => {
            navigate(`/error/404?path=${window.location.pathname}`);
        },
    });
}
