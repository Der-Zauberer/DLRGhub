<template>
    <div class="container-xl">

        <h2>Angaben gemäß §5 TMG</h2>
        <p>
            André Sommer<br>
            Primelweg 13<br>
            78224 Singen (Hohentwiel)<br>
            Deutschland
        </p>
        <span v-if="email">{{ email }}</span>
        <button @click="email = decode('YW5kLnNvbTI4MkBnbWFpbC5jb20=')" v-if="!email">Email anzeigen</button>

        <h2>Geltungsbereich des Impressums</h2>
        <p>Das Impressum gilt für folgende Seiten:</p>

        <ul>
            <li>DLRGhub <a href="https://dlrg.derzauberer.eu">https://dlrg.derzauberer.eu</a></li>
        </ul>

        <h2>Haftung für Inhalte</h2>
        <p>Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.</p>
        <p>Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.</p>
        
        <h2>Urheberrecht</h2>
        <p>Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.</p>
        <p>Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.</p>
        <p>Diese Software ist als <a target="_blank" href="https://github.com/Der-Zauberer/DLRGhub/tree/master?tab=Apache-2.0-1-ov-file#readme">Apache 2.0</a> lizensiert.</p>

    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const email = ref<string>()
const decode = (base64: string) => decodeURIComponent(escape(window.atob(base64)))
</script>