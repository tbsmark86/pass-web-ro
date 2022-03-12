import { html, css, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import * as openpgp from 'openpgp';

/**
 * gpg --output private.pgp --armor --export-secret-key
 */


@customElement('show-pass')
export class ShowPassElement extends LitElement {
    static styles = css`
	:host {
	    display: block;
	    border: solid 1px gray;
	    padding: 16px;
	    max-width: 800px;
	}
    `

    /**
     * The name to say "Hello" to.
     */
    @property()
    name = 'World'

    /**
     * The number of times the button has been clicked.
     */
    @property({ type: Number })
    count = 0

    render() {
	return html`
	  <h1>Hello, ${this.name}!</h1>
	  <button @click=${this._onClick} part="button">
	    Click Count: ${this.count}
	  </button>
	  <input type=password id=pass>
	  <button @click=${this.decode}>Decode</button>
	  <slot></slot>
	`
    }

    private _onClick() {
	this.count++
    }

    foo(): string {
	return 'foo'
    }

    private async decode() {
	// Doku:
	// https://github.com/openpgpjs/openpgpjs

	console.log('decode ...');
	//  strange vite behaviour: files with "." in the name are ignore :/ that should be document somewhere!
	const key = await (await fetch('/private')).text(); // .gpg
	const encrypted = await (await fetch('/wiki')).arrayBuffer(); // .gpg
	const passphrase = (this.shadowRoot!.getElementById('pass') as HTMLInputElement).value;

	const privateKey = await openpgp.decryptKey({
	    privateKey: await openpgp.readPrivateKey({ armoredKey: key }),
	    passphrase
	});

	const message = await openpgp.readMessage({
	    binaryMessage: new Uint8Array(encrypted) // parse armored message
	});
	const { data: decrypted } = await openpgp.decrypt({
	    message,
	    //verificationKeys: publicKey, // optional
	    decryptionKeys: privateKey
	});
	console.log(decrypted); // 'Hello, World!'
    }
}

declare global {
    interface HTMLElementTagNameMap {
	'show-pass': ShowPassElement
    }
}
