const API_BASE = 'https://www.thecocktaildb.com/api/json/v1/1';

const cardsRow = document.getElementById('cardsRow');
const notFound = document.getElementById('notFound');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const groupList = document.getElementById('groupList');
const groupCount = document.getElementById('groupCount');

let groupItems = [];

async function fetchByFirstLetter(letter) {
	const res = await fetch(`${API_BASE}/search.php?f=${letter}`);
	return res.json();
}

async function fetchByName(name) {
	const res = await fetch(`${API_BASE}/search.php?s=${encodeURIComponent(name)}`);
	return res.json();
}

async function fetchById(id) {
	const res = await fetch(`${API_BASE}/lookup.php?i=${id}`);
	return res.json();
}

function truncate(text, n=15) {
	if(!text) return '';
	return text.length>n ? text.slice(0,n)+'...' : text;
}

function clearCards(){ cardsRow.innerHTML=''; }

function renderDrinks(drinks){
	clearCards();
	if(!drinks || drinks.length===0){ notFound.style.display='block'; return; }
	notFound.style.display='none';
	drinks.forEach(drink=>{
		const col = document.createElement('div');
		col.className = 'col-md-6 col-lg-4';
		const card = document.createElement('div');
		card.className = 'card card-drink';
		const img = document.createElement('img');
		img.src = drink.strDrinkThumb || '';
		img.className = 'card-img-top';
		img.alt = drink.strDrink;
		const body = document.createElement('div');
		body.className = 'card-body d-flex flex-column';
		body.innerHTML = `<h6 class="card-title">Name: ${drink.strDrink}</h6>
			<p class="mb-1"><small>Category: ${drink.strCategory || ''}</small></p>
			<p class="mb-2">Instructions: ${truncate(drink.strInstructions,15)}</p>`;

		const footer = document.createElement('div');
		footer.className = 'card-footer d-flex justify-content-between';
		const addBtn = document.createElement('button');
		addBtn.className = 'btn btn-sm btn-outline-primary';
		addBtn.textContent = 'Add to Group';
		addBtn.addEventListener('click', ()=> addToGroup(drink));
		const detailsBtn = document.createElement('button');
		detailsBtn.className = 'btn btn-sm btn-outline-success';
		detailsBtn.textContent = 'Details';
		detailsBtn.addEventListener('click', ()=> showDetails(drink.idDrink));

		footer.appendChild(addBtn);
		footer.appendChild(detailsBtn);

		card.appendChild(img);
		card.appendChild(body);
		card.appendChild(footer);
		col.appendChild(card);
		cardsRow.appendChild(col);
	});
}

function updateGroupUI(){
	groupList.innerHTML='';
	groupItems.forEach((item, idx)=>{
		const li = document.createElement('li');
		li.className = 'list-group-item d-flex justify-content-between align-items-center';
		li.textContent = `${idx+1}. ${item}`;
		groupList.appendChild(li);
	});
	groupCount.textContent = groupItems.length;
}

function addToGroup(drink){
	if(groupItems.length>=7){ alert('Cannot add more than 7 drinks to a group'); return; }
	groupItems.push(drink.strDrink);
	updateGroupUI();
}

async function showDetails(id){
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

async function initialLoad(){
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
