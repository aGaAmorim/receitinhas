const API_URL = 'https://script.google.com/macros/s/AKfycbw1-ppJgG5_hSUUnoNQSjwj5OluAqXaZl3augQeOYmlgnYWHQrOCCpBxdLRucwIgUs7Sw/exec';

let recipes = [];
let tests = [];

let selectedCategory = 'Todas';
let searchTerm = '';


document.addEventListener('DOMContentLoaded', () => {

    loadData();

    setupSearch();

});


async function loadData() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error('Não foi possível acessar a API.');
        }

        const data = await response.json();

        recipes = data.receitas || [];
        tests = data.testes || [];

        createCategoryFilters();

        renderRecipes();

    } catch (error) {

        console.error(error);

        showError();

    }

}


/* =========================
   CATEGORIAS
========================= */

function createCategoryFilters() {

    const container =
        document.getElementById('categoryFilters');

    const categories = [
        ...new Set(
            recipes
                .map(recipe => recipe.Categoria)
                .filter(Boolean)
        )
    ];

    categories.sort();

    container.innerHTML = `
        <button
            class="category-button active"
            data-category="Todas"
        >
            ✨ Todas
        </button>
    `;

    categories.forEach(category => {

        const button =
            document.createElement('button');

        button.className = 'category-button';

        button.dataset.category = category;

        button.textContent = category;

        button.addEventListener(
            'click',
            () => selectCategory(category)
        );

        container.appendChild(button);

    });


    container
        .querySelector('[data-category="Todas"]')
        .addEventListener(
            'click',
            () => selectCategory('Todas')
        );

}


/* =========================
   CATEGORIA SELECIONADA
========================= */

function selectCategory(category) {

    selectedCategory = category;

    document
        .querySelectorAll('.category-button')
        .forEach(button => {

            button.classList.toggle(
                'active',
                button.dataset.category === category
            );

        });

    renderRecipes();

}


/* =========================
   PESQUISA
========================= */

function setupSearch() {

    const input =
        document.getElementById('searchInput');

    input.addEventListener('input', event => {

        searchTerm =
            event.target.value
                .trim()
                .toLowerCase();

        renderRecipes();

    });

}


/* =========================
   FILTRO
========================= */

function getFilteredRecipes() {

    return recipes.filter(recipe => {

        const categoryMatch =
            selectedCategory === 'Todas' ||
            recipe.Categoria === selectedCategory;


        const searchableText = [
            recipe.Receita,
            recipe.Categoria,
            recipe.Tags,
            recipe.Descrição
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();


        const searchMatch =
            !searchTerm ||
            searchableText.includes(searchTerm);


        return categoryMatch && searchMatch;

    });

}


/* =========================
   RENDER
========================= */

function renderRecipes() {

    const container =
        document.getElementById('recipesContainer');

    const filteredRecipes =
        getFilteredRecipes();


    document.getElementById('recipeCount')
        .textContent =
        `${filteredRecipes.length} receita${
            filteredRecipes.length !== 1
                ? 's'
                : ''
        }`;


    if (!filteredRecipes.length) {

        container.innerHTML = `
            <div class="empty-state">

                <p>
                    Não encontramos nenhuma
                    receitinha por aqui ♡
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        filteredRecipes
            .map(createRecipeCard)
            .join('');

}


/* =========================
   CARD
========================= */

function createRecipeCard(recipe) {

    const tags = parseTags(recipe.Tags);

    const recipeTests =
        tests.filter(test =>
            String(test['ID Receita']) ===
            String(recipe.ID)
        );


    const tested =
        recipeTests.some(test =>
            String(test.Status).toLowerCase() ===
            'testada'
        );


    const image = recipe.Imagem
        ? `
            <img
                src="${escapeAttribute(recipe.Imagem)}"
                alt="${escapeAttribute(recipe.Receita)}"
                loading="lazy"
            >
        `
        : `
            <span class="recipe-placeholder">
                ♡
            </span>
        `;


    const tagsHTML =
        tags
            .map(tag =>
                `<span class="recipe-tag">#${escapeHTML(tag)}</span>`
            )
            .join('');


    return `
        <article class="recipe-card">

            <div class="recipe-image">
                ${image}
            </div>

            <div class="recipe-content">

                ${
                    recipe.Categoria
                        ? `
                            <span class="recipe-category">
                                ${escapeHTML(recipe.Categoria)}
                            </span>
                        `
                        : ''
                }


                <h4 class="recipe-title">
                    ${escapeHTML(recipe.Receita)}
                </h4>


                ${
                    recipe.Descrição
                        ? `
                            <p class="recipe-description">
                                ${escapeHTML(recipe.Descrição)}
                            </p>
                        `
                        : ''
                }


                ${
                    tagsHTML
                        ? `
                            <div class="recipe-tags">
                                ${tagsHTML}
                            </div>
                        `
                        : ''
                }


                <div class="recipe-footer">

                    <span class="recipe-status">
                        ${
                            tested
                                ? '✓ Testada'
                                : '♡ Ainda não testada'
                        }
                    </span>


                    ${
                        recipe.Link
                            ? `
                                <a
                                    class="recipe-link"
                                    href="${escapeAttribute(recipe.Link)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Ver receita →
                                </a>
                            `
                            : ''
                    }

                </div>

            </div>

        </article>
    `;

}


/* =========================
   TAGS
========================= */

function parseTags(tags) {

    if (!tags) {
        return [];
    }

    return String(tags)
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);

}


/* =========================
   ERRO
========================= */

function showError() {

    const container =
        document.getElementById('recipesContainer');

    container.innerHTML = `
        <div class="empty-state">

            <p>
                Ops! Não conseguimos carregar
                nossas receitinhas. ♡
            </p>

        </div>
    `;

}


/* =========================
   SEGURANÇA
========================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


function escapeAttribute(value) {

    return escapeHTML(value);

}
