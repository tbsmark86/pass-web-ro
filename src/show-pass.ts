import { html, css, LitElement } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import * as openpgp from 'openpgp';

/**
 * Dialog to decrypt a single password
 */
@customElement('show-pass')
export class ShowPassElement extends LitElement {
    static styles = css`
	:host {
	    width: 0; height: 0;
	}
	output {
	    min-height: 1.1em;
	    display: block;
	    border: 1px solid black;
	    margin: 0.5em 0;
	    font-family: monospace;
	    white-space: pre-wrap;
	    padding: 5px;
	}
    `

    /**
     * The password name
     */
    @property() name = '';

    /**
     * The Encrypted data
     */
    @property() encrypted = '';

    /**
     * The Private Key
     */
    @property() privateKey = '';

    @query('#pass')
    private passEle?: HTMLInputElement;
    @query('#output')
    private outputEle?: HTMLOutputElement;
    @query('dialog')
    private dialogEle?: HTMLDialogElement;

    render() {
	return html`<dialog><form method=dialog>
	  <h2>${this.name}</h1>
	  <label>Master Password: <input type=password id=pass></label>
	    <button type=submit @click=${this.decode}>Decode</button>
	  <output id=output></output>
	  <button @click=${this.copy}>Copy&amp;Close</button>
	  <button @click=${this.close}>Close</button>
	</form></dialog>`
    }

    private async decode(event: Event) {
	// Docs:  https://github.com/openpgpjs/openpgpjs
	event.preventDefault();
	
	let privateKey;
	try {
	    privateKey = await openpgp.decryptKey({
		privateKey: await openpgp.readPrivateKey({
		    binaryKey: Uint8Array.from(atob(this.privateKey), c => c.charCodeAt(0))
		}),
		passphrase: this.passEle!.value
	    });
	} catch(e) {
	    this.outputEle!.innerText = (e as Error).message;
	    return;
	}
	this.passEle!.value = '';

	let decrypted;
	try {
	    const message = await openpgp.readMessage({
		binaryMessage: Uint8Array.from(atob(this.encrypted), c => c.charCodeAt(0))
	    });
	    const res = await openpgp.decrypt({
		message,
		decryptionKeys: privateKey
	    });
	    decrypted = res.data;
	} catch(e) {
	    this.outputEle!.innerText = (e as Error).message;
	    return;
	}
	this.outputEle!.innerText = decrypted;
	window.setTimeout(() => {
	    this.outputEle!.innerText = 'Cleared after Timeout'; 
	}, 30 * 1000);
    }

    private close() {
	this.outputEle!.innerText = '';
	// @ts-expect-error missing typeings
	this.dialogEle.close();
    }

    private copy() {
	let text = this.outputEle!.innerText;
	let lines = text.split('\n');
	navigator.clipboard.writeText(lines[0])
	// try to clear clipboard
	window.setTimeout(() => {
	    navigator.clipboard.writeText('')
	}, 30 * 1000);
	this.close();
    }

    use(name: string, encrypted: string) {
	this.name = name;
	this.encrypted = encrypted;
	// @ts-expect-error missing typeings
	this.dialogEle.showModal();
    }
}

declare global {
    interface HTMLElementTagNameMap {
	'show-pass': ShowPassElement
    }
}
