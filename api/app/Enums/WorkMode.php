<?php

namespace App\Enums;

enum WorkMode: string
{
    case Onsite = 'onsite';
    case Hybrid = 'hybrid';
    case Remote = 'remote';
}
