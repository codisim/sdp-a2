const API_BASE = 'https://www.thecocktaildb.com/api/json/v1/1';

const cardsRow = document.getElementById('cardsRow');
const notFound = document.getElementById('notFound');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const groupList = document.getElementById('groupList');
const groupCount = document.getElementById('groupCount');

// store objects: {id, name, thumb}
let groupItems = [];

const fetchByFirstLetter = async (letter) => {
	const res = await fetch(`${API_BASE}/search.php?f=${letter}`);
	return res.json();
}

const fetchByName = async (name) => {
	const res = await fetch(`${API_BASE}/search.php?s=${encodeURIComponent(name)}`);
	return res.json();
}

const fetchById = async (id) => {
	const res = await fetch(`${API_BASE}/lookup.php?i=${id}`);
	return res.json();
}

const truncate = (text, n=15) => {
	if(!text) return '';
	return text.length>n ? text.slice(0,n)+'...' : text;
}

const clearCards = () => { cardsRow.innerHTML=''; }

// helper: create element with optional class and attrs
const createEl = (tag, className, attrs) => {
	const el = document.createElement(tag);
	if(className) el.className = className;
	if(attrs){
		Object.keys(attrs).forEach(k=>{
			if(k === 'text') el.textContent = attrs[k];
			else el.setAttribute(k, attrs[k]);
		});
	}
	return el;
}

const isSelected = (id) => groupItems.find(g=>g.id===id);

const setAddButtonState = (btn, selected) => {
	if(selected){
		btn.textContent = 'Already Selected';
		btn.className = 'btn btn-sm btn-secondary';
		btn.disabled = true;
	} else {
		btn.textContent = 'Add to Cart';
		btn.className = 'btn btn-sm btn-outline-primary';
		btn.disabled = false;
	}
}

// create card using innerHTML/template style
const makeCard = (drink) => {
	const col = createEl('div','col-md-6 col-lg-4');
	const card = createEl('div','card card-drink');
	const idArg = JSON.stringify(drink.idDrink);
	const nameArg = JSON.stringify(drink.strDrink || '');
	const thumbArg = JSON.stringify(drink.strDrinkThumb || '');
	const selected = isSelected(drink.idDrink);
	card.innerHTML = `
		<img src="${drink.strDrinkThumb||''}" class="card-img-top" alt="${drink.strDrink}">
		<div class="card-body d-flex flex-column">
			<h6 class="card-title">Name: ${drink.strDrink}</h6>
			<p class="mb-1"><small>Category: ${drink.strCategory || ''}</small></p>
			<p class="mb-2">Instructions: ${truncate(drink.strInstructions,15)}</p>
		</div>
		<div class="card-footer d-flex justify-content-between">
			<button class="btn btn-sm ${selected ? 'btn-secondary' : 'btn-outline-primary'}" ${selected ? 'disabled' : ''} onclick="handleAddToCart(${idArg}, this, ${nameArg}, ${thumbArg})">${selected ? 'Already Selected' : 'Add to Cart'}</button>
			<button class="btn btn-sm btn-outline-success" onclick="handleShowDetails(${idArg})">Details</button>
		</div>
	`;
	col.appendChild(card);
	return col;
}

// global handlers for inline onclick usage
window.handleAddToCart = (id, btn, name, thumb) => {
	const drink = { idDrink: id, strDrink: name, strDrinkThumb: thumb };
	addToGroup(drink, btn);
}

window.handleShowDetails = (id) => {
	showDetails(id);
}

const renderDrinks = (drinks) => {
	clearCards();
	if(!drinks || drinks.length===0){ notFound.style.display='block'; return; }
	notFound.style.display='none';
	drinks.forEach(drink=> cardsRow.appendChild(makeCard(drink)) );
}
const makeGroupListItem = (item, idx) => {
	const li = createEl('li','list-group-item');
	li.innerHTML = `
		<div class="d-flex align-items-center">
			<div class="me-2 fw-bold" style="width:28px;text-align:center">${idx+1}</div>
			<img src="${item.thumb||''}" alt="" class="rounded-circle me-2" style="width:44px;height:44px;object-fit:cover">
			<div class="flex-grow-1">${item.name}</div>
		</div>
	`;
	return li;
}

const updateGroupUI = () => {
	groupList.innerHTML='';
	groupItems.forEach((item, idx)=> groupList.appendChild(makeGroupListItem(item, idx)));
	groupCount.textContent = groupItems.length;
}

const addToGroup = (drink, btn) => {
	if(groupItems.length>=7){ alert('Cannot add more than 7 drinks to a group'); return; }
	if(groupItems.find(g=>g.id===drink.idDrink)){
		// already selected
		if(btn) setAddButtonState(btn, true);
		return;
	}
	groupItems.push({ id: drink.idDrink, name: drink.strDrink, thumb: drink.strDrinkThumb });
	// update clicked button state
	if(btn) setAddButtonState(btn, true);
	updateGroupUI();
}

const showDetails = async (id) => {
	const data = await fetchById(id);
	const drink = data.drinks && data.drinks[0];
	if(!drink) return;
	const modalTitle = document.getElementById('modalTitle');
	const modalBody = document.getElementById('modalBody');
	modalTitle.textContent = drink.strDrink;
	// collect ingredients
	const ingredients = [];
	for(let i=1;i<=15;i++){
		const ing = drink[`strIngredient${i}`];
		const measure = drink[`strMeasure${i}`];
		if(ing) ingredients.push(`${ing}${measure? ' - '+measure : ''}`);
	}
	modalBody.innerHTML = `
		<div class="container-fluid">
			<div class="row">
				<div class="col-md-5"><img src="${drink.strDrinkThumb}" class="img-fluid"/></div>
				<div class="col-md-7">
					<p><strong>Category:</strong> ${drink.strCategory || ''}</p>
					<p><strong>Alcoholic:</strong> ${drink.strAlcoholic || ''}</p>
					<p><strong>Glass:</strong> ${drink.strGlass || ''}</p>
					<p><strong>Instructions:</strong> ${drink.strInstructions || ''}</p>
					<p><strong>Ingredients:</strong><br>${ingredients.join('<br>')}</p>
				</div>
			</div>
		</div>
	`;
	const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
	modal.show();
}

const initialLoad = async () => {
	// load by first letter 'a' and show first 10
	const res = await fetchByFirstLetter('a');
	const drinks = res.drinks ? res.drinks.slice(0,10) : [];
	renderDrinks(drinks);
}

searchBtn.addEventListener('click', async ()=>{
	const q = searchInput.value.trim();
	if(!q){ initialLoad(); return; }
	let res;
	if(q.length===1){ res = await fetchByFirstLetter(q); }
	else { res = await fetchByName(q); }
	const drinks = res.drinks || [];
	renderDrinks(drinks);
});

// allow Enter key
searchInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ searchBtn.click(); } });

initialLoad();
