<?php
/*
 * Plugin Name: Antidiscriminatiemonitor
 * Description: interactieve kaart Antidiscriminatiemonitor 2025
 * Version: 1.0
 * Author: Erik Jan de Wilde
 * License: GPL v2 or later
 * Text Domain: grondmap
 *
 */
defined('ABSPATH') or die('Nee da mag nie');
error_reporting(E_ALL);
ini_set('display_errors', 1);
 
function tsa($test)
{ // for debug/development only
    echo '<pre>';
    //echo 'er wordt momenteel aan de rapportage gewerkt, vandaar deze technische mededelingen</br>';
    echo '----------------------------------------------------------------------------------</br>';
    echo print_r($test, true);
    echo '</pre>';
}

// Include vereiste PHP-bestanden

require_once 'verwerk_data.php';
require_once 'adm_map.php';
//require_once __DIR__ . '/koppelen.php';


// Shortcode [gemscan] – interactieve vragenlijst

function grond_map_shortcode()
{
    // Enqueue en lokaliseer script
    wp_enqueue_script('admmap', plugin_dir_url(__FILE__) . 'js/adm_map.js', ['highcharts', 'highcharts-maps', 'highcharts-nl'], '1.0', true);

    $map = new Adm_Map();
    return $map->get_map();
}
add_shortcode('grondmap', 'grond_map_shortcode');


// Enqueue externe libraries en CSS (TomSelect en hoofdstylesheet)
function grondmap_enqueue_libraries()
{
    wp_enqueue_style('grondmap-css', plugin_dir_url(__FILE__) . 'css/style.css');
}
add_action('wp_enqueue_scripts', 'grondmap_enqueue_libraries');