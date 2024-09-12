export class RouteDropdown {
    constructor() {
        this.container = document.getElementById('dropdown-container');
        this.title = document.createElement('div');
        this.title.setAttribute("id", "dropdown-title");
        this.title.textContent = "Select Bus Route";
        this.select = document.createElement('select');

        Object.keys(routes).forEach(route => {
            const option = document.createElement('option');
            option.value = route;
            option.textContent = route;
            this.select.appendChild(option);
        });

        this.container.appendChild(this.title);
        this.container.appendChild(this.select);
    }
}