// TODO: util has to be moved to LdesUtil of the package VersionAwareLIL
import { Communication, ILDESinLDPMetadata, LDES, LDESMetadata, LDP, patchSparqlUpdateDelete, RDF, storeToString, TREE, XSD } from "@treecg/versionawareldesinldp";
import { DataFactory, Store } from "n3";
import { Logger } from "@treecg/versionawareldesinldp/dist/logging/Logger";
const { quad, namedNode, literal } = DataFactory

/**
 * Convert the ldes metadata object back to an N3 Store
 * @param metadata
 * @returns {Store}
 */
export function convertLdesMetadata(metadata: LDESMetadata): Store {
    const metadataStore = new Store()
    // LDES itself
    metadataStore.addQuad(quad(namedNode(metadata.ldesEventStreamIdentifier), RDF.terms.type, LDES.terms.EventStream))
    metadataStore.addQuad(quad(namedNode(metadata.ldesEventStreamIdentifier), LDES.terms.timestampPath, namedNode(metadata.timestampPath)))
    metadataStore.addQuad(quad(namedNode(metadata.ldesEventStreamIdentifier), LDES.terms.versionOfPath, namedNode(metadata.versionOfPath)))
    // Root node
    const rootnode = metadata.views[0]
    metadataStore.addQuad(quad(namedNode(metadata.ldesEventStreamIdentifier), TREE.terms.view, namedNode(rootnode.id)))
    metadataStore.addQuad(quad(namedNode(rootnode.id), RDF.terms.type, TREE.terms.Node))

    // relations
    const relations = rootnode.relations
    for (const relation of relations) {
        const bn = metadataStore.createBlankNode()

        metadataStore.addQuad(quad(namedNode(rootnode.id), TREE.terms.relation, bn))

        metadataStore.addQuad(bn, RDF.terms.type, namedNode(relation.type))
        metadataStore.addQuad(bn, TREE.terms.node, namedNode(relation.node))
        metadataStore.addQuad(bn, TREE.terms.path, namedNode(metadata.timestampPath))
        metadataStore.addQuad(bn, TREE.terms.value, literal(relation.value, XSD.terms.dateTime))
    }
    // inbox
    metadataStore.addQuad(quad(namedNode(rootnode.id), LDP.terms.inbox, namedNode(metadata.inbox)))
    return metadataStore
}

export async function editMetadata(resourceIdentifier: string, communication: Communication, body: string): Promise<void> {
    const logger = new Logger(editMetadata.name)
    console.log("Editing metadata of " + resourceIdentifier);
    const response = await communication.patch(resourceIdentifier + '.meta', body);
    
    if (response.status === 409){
        logger.error("409 Conflict: " + await response.text())
    }
    if (response.status !== 205) {
        logger.error("Something went wrong when trying to patch the root. This MUST NOT HAPPEN")
        logger.error("Body that should have been inserted: " + body)
        logger.error(await response.text())
    }
}

export async function removeRelationFromPage(args: {
    communication: Communication,
    containerURL: string,
    metadata: ILDESinLDPMetadata,
    resourceURL: string,
}): Promise<void> {
    const {communication, containerURL, metadata, resourceURL} = args;
    let store = new Store();
    store.add(quad(namedNode(containerURL), namedNode(TREE.relation), namedNode(resourceURL)));
    console.log(store.getQuads(null, null, null, null));
    await communication.patch(containerURL + '.meta', patchSparqlUpdateDelete(store)).then(() => {
        console.log("Relation removed from page");
    });
}