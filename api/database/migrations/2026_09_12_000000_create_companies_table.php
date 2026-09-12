<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('auth_user_id')->constrained('auth_users')->cascadeOnDelete();
            $table->string('name', 160);
            $table->string('website', 2048)->nullable();
            $table->string('location', 160)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['auth_user_id', 'name']);
            $table->index(['auth_user_id', 'location']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
