import { html, LitElement, TemplateResult, css } from 'lit'
import { customElement, query } from 'lit/decorators.js'
import { Tree } from './app-main'

/**
 * Tree Display of password data
 */
@customElement('pass-tree')
export class TreeWrapElement extends LitElement {
    static styles = css`
	.folder {
	    list-style-type: none;
	    margin-left: -1em;
	}
	li {
	    margin-top: 0.5em;
	    margin-bottom: 0.5em;
	}
    `

    @query('#search')
    private searchEle?: HTMLInputElement;
    @query('#cont')
    private contEle?: HTMLElement;

    private _value: Tree =  {};

    public get value(): Tree { return this._value; }
    public set value(v: Tree) {
	this._value = v;
	this.requestUpdate();
    }

    render() {
	return html`
	    <form><input type=search id=search placeholder=Search @keyup=${this.doSearch}></form>
	    <div id=cont>${this.renderTree(this._value, '')}</div>
	`
    }

    private renderTree(tree: Tree, path: string): TemplateResult
    {
	const itemTemplates = [];
	for(const [name, value] of Object.entries(tree)) {
	    const fullname = path + name;
	    if(typeof(value) === 'string') {
		itemTemplates.push(html`<li class=item data-value=${value} data-name=${fullname}>
		    <button @click=${this.onClick}>${name}</button>
		</li>`);
	    } else {
		itemTemplates.push(html`<li class=folder><details><summary>${name}</summary>${
		    this.renderTree(value, `${path}${name}/`)
		}</details></li>`);
	    }
	}
	return html`<ul>${itemTemplates}</ul>`;
    }

    private onClick(event: Event) {
	const ele = (event.currentTarget as HTMLElement).parentElement;
	const name = ele?.dataset.name;
	const value = ele?.dataset.value;
	if(!name || !value) {
	    alert('something went wrong!');
	    return;
	}
	let ourEvent = new CustomEvent('select', {detail: {name, value}});
	this.dispatchEvent(ourEvent);
    }

    private doSearch() {
	if(!this.contEle) {
	    // strange, but clearly nothing to search
	    return;
	}
	let search = this.searchEle?.value;
	if(!search) {
	    for(let li of this.contEle.querySelectorAll<HTMLElement>('li')) {
		li.style.display = 'list-item';
	    }
	    for(let detail of this.contEle.querySelectorAll<HTMLDetailsElement>('details')) {
		detail.open = false;
	    }
	    return;
	}
	search = search.toLowerCase();
	for(let li of this.contEle.querySelectorAll<HTMLElement>('li.folder')) {
	    li.style.display = 'none';
	}
	for(let detail of this.contEle.querySelectorAll<HTMLDetailsElement>('details')) {
	    detail.open = false;
	}
	for(let li of this.contEle.querySelectorAll<HTMLElement>('li.item')) {
	    if(li.dataset.name?.toLowerCase().includes(search)) {
		console.log('found', search);
		for(let parent = li.parentElement; parent; parent = parent.parentElement) {
		    if(parent.classList.contains('folder')) {
			parent.style.display = 'block';
		    } else if(parent instanceof HTMLDetailsElement) {
			parent.open = true;
		    }
		}
	    } else {
		li.style.display = 'none';
	    }
	}
    }
}

declare global {
    interface HTMLElementTagNameMap {
	'pass-tree': TreeWrapElement
    }
}
