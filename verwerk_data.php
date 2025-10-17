<?php

add_action('wp_ajax_haal_grond_info_op', 'haal_grond_info_op');
add_action('wp_ajax_nopriv_haal_grond_info_op', 'haal_grond_info_op');

function haal_grond_info_op()
{
    global $wpdb;
 
    $result = $wpdb->get_results("
        SELECT id, naam
        FROM discriminatiegronden ORDER BY id");

    $data = [];
    foreach ($result as $row) {
        $data[$row->id] = $row->naam;
    }
    wp_send_json($data);
}

add_action('wp_ajax_haal_gemeente_grond_op', 'haal_gemeente_grond_op');

function haal_gemeente_grond_op()
{
    global $wpdb;

    $result = $wpdb->get_results("
        SELECT p.naam as grond, pg.discval as waarde, g.code, g.naam
        FROM discriminatiegronden p
        INNER JOIN vng_antidiscriminatie pg ON p.id = pg.discID
        INNER JOIN vng_gemeenten g ON pg.gmcode = g.code
        ORDER BY p.naam, g.naam
    ");

    // Groepeer per gemeente
    $data = [];
    foreach ($result as $row) {
        if (! isset($data[$row->code])) {
            $data[$row->code] = [
                'naam'      => $row->naam,
                'gronden' => [],
            ];
        }
        $data[$row->code]['gronden'][$row->grond] = $row->waarde;
    }
    //wp_send_json("jojo");
    wp_send_json($data);
}


add_action('wp_ajax_get_gronden', 'get_gronden');
function get_gronden()
{
    global $wpdb;

    $results = $wpdb->get_results("SELECT * FROM discriminatiegronden ORDER BY naam", ARRAY_A);

    wp_send_json_success($results);
}

add_action('wp_ajax_get_gemeenten', 'get_grond_gemeenten');
function get_grond_gemeenten()
{
    global $wpdb;

    $results = $wpdb->get_results("SELECT * FROM vng_gemeenten", ARRAY_A);

    wp_send_json($results);
}