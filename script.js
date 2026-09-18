const API_URL = 'https://script.google.com/macros/s/AKfycbw1-ppJgG5_hSUUnoNQSjwj5OluAqXaZl3augQeOYmlgnYWHQrOCCpBxdLRucwIgUs7Sw/exec';

let recipes = [];
let tests = [];

let selectedCategory = 'Todas';
let searchTerm = '';


document.addEventListener('DOMContentLoaded', () => {

    loadData();

    setupSearch();

});


/* =========================
   CARREGAR DADOS DA API
========================= */

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
            type="button"
            class="category-button active"
            data-category="Todas"
        >
            ✨ Todas
        </button>
    `;

    categories.forEach(category => {

        const button =
            document.createElement('button');

        button.type = 'button';

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

    updateSeasonalTheme(category);

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


        /*
         * A pesquisa procura em:
         * - nome da receita
         * - categoria
         * - tags
         * - descrição
         */

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
   RENDER DAS RECEITAS
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
   CARD DA RECEITA
========================= */

function createRecipeCard(recipe) {

    const tags =
        parseTags(recipe.Tags);


    /* =========================
       TESTES DA RECEITA
    ========================= */

    const recipeTests =
        tests.filter(test =>
            String(test['Id Receita']) ===
            String(recipe.Id)
        );


    /*
     * Pegamos somente os testes
     * cujo status é "Testada".
     */

    const testedTests =
        recipeTests.filter(test =>
            String(test.Status).toLowerCase() ===
            'testada'
        );


    /* =========================
       TESTES - HTML
    ========================= */

    const testsHTML =
        testedTests.length
            ? `
                <div class="recipe-tests">

                    ${testedTests.map(test => {

                        const person =
                            test.Pessoa || '';

                        const observation =
                            test.Observação || '';

                        const nota =
                            Number(test.Nota) || 0;


                        /*
                         * Cria 5 estrelas.
                         *
                         * Exemplo:
                         * Nota 5 = ★★★★★
                         * Nota 4 = ★★★★☆
                         * Nota 3 = ★★★☆☆
                         */

                        const stars =
                            Array.from(
                                { length: 5 },
                                (_, index) =>
                                    index < nota
                                        ? '★'
                                        : '☆'
                            ).join('');


                        return `
                            <div class="recipe-test">

                                <div class="recipe-test-header">

                                    <span class="recipe-test-person">
                                        ${escapeHTML(person)}
                                    </span>

                                    <span class="recipe-test-rating">
                                        ${stars}
                                    </span>

                                </div>


                                ${
                                    observation
                                        ? `
                                            <p class="recipe-test-observation">
                                                “${escapeHTML(observation)}”
                                            </p>
                                        `
                                        : ''
                                }

                            </div>
                        `;

                    }).join('')}

                </div>
            `
            : `
                <div class="recipe-not-tested">
                    ♡ Ainda não testada
                </div>
            `;


    /* =========================
       IMAGEM
    ========================= */

    const imageUrl =
    recipe.Imagem
        ? `https://drive.google.com/thumbnail?id=${recipe.Imagem}&sz=w1000`
        : '';

const image =
    imageUrl
        ? `
            <img
                src="${escapeAttribute(imageUrl)}"
                alt="${escapeAttribute(recipe.Receita)}"
                loading="lazy"
            >
        `
        : `
            <span class="recipe-placeholder">
                ♡
            </span>
        `;


    /* =========================
       TAGS
    ========================= */

    const tagsHTML =
        tags
            .map(tag =>
                `
                    <span class="recipe-tag">
                        #${escapeHTML(tag)}
                    </span>
                `
            )
            .join('');


    /* =========================
       CARD COMPLETO
    ========================= */

    return `
        <article class="recipe-card">


            <!-- IMAGEM -->

            <div class="recipe-image">

                ${image}

            </div>


            <!-- CONTEÚDO -->

            <div class="recipe-content">


                <!-- CATEGORIA -->

                ${
                    recipe.Categoria
                        ? `
                            <span class="recipe-category">
                                ${escapeHTML(recipe.Categoria)}
                            </span>
                        `
                        : ''
                }


                <!-- NOME -->

                <h4 class="recipe-title">
                    ${escapeHTML(recipe.Receita)}
                </h4>


                <!-- DESCRIÇÃO -->

                ${
                    recipe.Descrição
                        ? `
                            <p class="recipe-description">
                                ${escapeHTML(recipe.Descrição)}
                            </p>
                        `
                        : ''
                }


                <!-- TAGS -->

                ${
                    tagsHTML
                        ? `
                            <div class="recipe-tags">
                                ${tagsHTML}
                            </div>
                        `
                        : ''
                }


                <!-- TESTES -->

                ${testsHTML}


                <!-- RODAPÉ -->

                <div class="recipe-footer">


                    ${
                        testedTests.length
                            ? `
                                <span class="tested-label">
                                    ✓ Testada
                                </span>
                            `
                            : ''
                    }


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
   TEMA ESPECIAL DE NATAL
========================= */

function updateSeasonalTheme(category) {

    const isChristmas =
        String(category).toLowerCase() ===
        'especial de natal';


    document.body.classList.toggle(
        'christmas-theme',
        isChristmas
    );


    if (isChristmas) {

        createSnow();

    } else {

        removeSnow();

    }

}


/* =========================
   NEVE
========================= */

function createSnow() {

    if (document.getElementById('snowContainer')) {
        return;
    }


    const snowContainer =
        document.createElement('div');

    snowContainer.id =
        'snowContainer';

    snowContainer.className =
        'snow-container';


    for (let i = 0; i < 45; i++) {

        const snowflake =
            document.createElement('span');

        snowflake.className =
            'snowflake';

        snowflake.textContent = '•';


        snowflake.style.left =
            `${Math.random() * 100}%`;

        snowflake.style.animationDuration =
            `${6 + Math.random() * 8}s`;

        snowflake.style.animationDelay =
            `${Math.random() * 8}s`;

        snowflake.style.fontSize =
            `${5 + Math.random() * 7}px`;

        snowflake.style.opacity =
            `${0.35 + Math.random() * 0.5}`;


        snowContainer.appendChild(
            snowflake
        );

    }


    document.body.appendChild(
        snowContainer
    );

}


function removeSnow() {

    const snowContainer =
        document.getElementById('snowContainer');

    if (snowContainer) {

        snowContainer.remove();

    }

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
